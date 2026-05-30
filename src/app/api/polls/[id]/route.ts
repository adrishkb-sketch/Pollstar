import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { sendPollInvitationEmail, sendPollClosedEmail, sendPollScheduleUpdatedEmail, sendExamResultsReleasedEmail } from '@/lib/nodemailer';
import { checkFeatureAccess } from '@/lib/featureGate';

// Helper to authenticate user from cookies
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  let payload = token ? verifyAccessToken(token) : null;

  if (!payload && refreshToken) {
    const refreshPayload = verifyRefreshToken(refreshToken);
    if (refreshPayload) {
      payload = {
        userId: refreshPayload.userId,
        email: refreshPayload.email,
        role: refreshPayload.role,
      };
    }
  }

  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

/**
 * GET: Retrieves a single poll by ID.
 * Returns questions, options, settings, and stats.
 * If authorized as creator or admin, includes the list of allowed voters and individual vote logs.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const user = await getAuthUser();

    // Check if maintenance mode is active
    const maintenanceConfig = await prisma.siteConfig.findUnique({
      where: { key: 'maintenance_mode_enabled' }
    });
    if (maintenanceConfig && maintenanceConfig.value === 'true' && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { maintenance: true, error: 'Platform is currently undergoing scheduled maintenance.' },
        { status: 503 }
      );
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isVerifiedUser: true,
            avatar: true,
            plan: true,
          }
        },
        questions: {
          include: { options: true },
        },
        settings: true,
        votes: true,
        allowedVoters: true,
        collaborators: true,
      },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Auto-upgrade previously created surveys from POLL -> SURVEY
    if (poll.pollType === 'POLL') {
      const hasSurveyQuestions = poll.questions.some(q => 
        q.type === 'SHORT_TEXT' || q.type === 'LONG_TEXT' || q.type === 'RATING'
      );
      const hasSurveySettings = poll.settings ? (
        poll.settings.collectEmail === true ||
        poll.settings.enableDropOffTracking === true ||
        poll.settings.enableSemanticAnalysis === true ||
        poll.settings.enableCrossTabulation === true ||
        poll.settings.enableTimeAnalytics === true ||
        poll.settings.postEmailMessage !== null
      ) : false;
      const hasMultiplePages = poll.questions.some(q => q.pageNumber > 1);

      if (hasSurveyQuestions || hasSurveySettings || hasMultiplePages) {
        await prisma.poll.update({
          where: { id: pollId },
          data: { pollType: 'SURVEY' }
        });
        poll.pollType = 'SURVEY';
      }
    }

    // Auto-expire: if the poll is ACTIVE but endTime has passed, transition to ENDED
    if (poll.status === 'ACTIVE' && poll.endTime && new Date() > new Date(poll.endTime)) {
      await prisma.poll.update({
        where: { id: pollId },
        data: { status: 'ENDED' },
      });
      poll.status = 'ENDED';
    }

    // Check if requester is creator, admin, or collaborator
    const isCollaborator = user && poll.collaborators.some((c: any) => c.userId === user.id);
    const isCreatorOrAdmin = user && (poll.creatorId === user.id || user.role === 'ADMIN' || isCollaborator);

    // Build statistics
    const stats: Record<string, any> = {};
    for (const q of poll.questions) {
      stats[q.id] = {};
      q.options.forEach((o) => {
        stats[q.id][o.id] = { text: o.text, count: 0 };
      });
    }

    // Calculate normal choices or ranked border points
    poll.votes.forEach((v) => {
      try {
        const answers = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
        Object.keys(answers).forEach((qId) => {
          const ans = answers[qId];
          const question = poll.questions.find((q) => q.id === qId);

          if (question) {
            if (question.type === 'RANKED' && Array.isArray(ans)) {
              // Borda Count weights
              const numOptions = question.options.length;
              ans.forEach((optId: string, index: number) => {
                if (stats[qId] && stats[qId][optId]) {
                  stats[qId][optId].count += numOptions - index;
                }
              });
            } else if (question.type === 'SINGLE') {
              if (typeof ans === 'string') {
                if (stats[qId] && stats[qId][ans]) {
                  stats[qId][ans].count += 1;
                }
              } else if (typeof ans === 'object' && ans !== null) {
                Object.entries(ans).forEach(([optId, votesCount]) => {
                  if (stats[qId] && stats[qId][optId]) {
                    stats[qId][optId].count += Number(votesCount) || 0;
                  }
                });
              }
            } else if (question.type === 'KNOCKOUT' && ans && typeof ans.winner === 'string') {
              if (stats[qId] && stats[qId][ans.winner]) {
                stats[qId][ans.winner].count += 1;
              }
            }
          }
        });
      } catch (e) {
        console.error('Error parsing vote answers:', e);
      }
    });

    // Clean data if the user is a normal voter (not creator/admin)
    const cleanedPoll = {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      posterUrl: poll.posterUrl,
      isOpenVoting: poll.isOpenVoting,
      isAnonymous: poll.isAnonymous,
      isResultPublic: poll.isResultPublic,
      startTime: poll.startTime,
      endTime: poll.endTime,
      status: poll.status,
      pollType: poll.pollType,
      questions: poll.questions,
      settings: poll.settings,
      stats,
      totalVotes: poll.votes.length,
      creator: poll.creator,
      // Only include logs and allowed voter list if creator or admin
      allowedVoters: isCreatorOrAdmin ? poll.allowedVoters : undefined,
      votes: isCreatorOrAdmin
        ? poll.votes.map((v) => {
            const showIdentity = !poll.isAnonymous || (user && user.role === 'ADMIN');
            return {
              id: v.id,
              userIdentifier: showIdentity ? v.userIdentifier : 'Anonymous',
              email: showIdentity ? v.email : 'Anonymous',
              ipAddress: v.ipAddress,
              isp: v.isp,
              flaggedSuspicious: v.flaggedSuspicious,
              latitude: v.latitude,
              longitude: v.longitude,
              createdAt: v.createdAt,
              answers: showIdentity ? (typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers) : undefined,
            };
          })
        : (poll.isResultPublic
            ? poll.votes.map((v) => ({
                id: v.id,
                ipAddress: 'Masked',
                isp: v.isp || 'Unknown ISP',
                flaggedSuspicious: v.flaggedSuspicious,
                latitude: v.latitude,
                longitude: v.longitude,
                createdAt: v.createdAt,
                answers: typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers,
              }))
            : undefined),
    };
    // Parse focus from query parameters for presence tracking
    const { searchParams } = new URL(req.url);
    const focusField = searchParams.get('focus') || '';

    if (!(global as any).pollPresence) {
      (global as any).pollPresence = {};
    }

    if (user) {
      const pollPres = (global as any).pollPresence;
      if (!pollPres[pollId]) {
        pollPres[pollId] = {};
      }
      pollPres[pollId][user.id] = {
        fullName: user.fullName || user.email.split('@')[0],
        email: user.email,
        focus: focusField,
        timestamp: Date.now(),
      };
    }

    const activeCollaborators: any[] = [];
    const pollPres = (global as any).pollPresence;
    if (pollPres && pollPres[pollId]) {
      const now = Date.now();
      Object.keys(pollPres[pollId]).forEach((uid) => {
        const entry = pollPres[pollId][uid];
        if (now - entry.timestamp > 10000) {
          delete pollPres[pollId][uid];
        } else if (!user || uid !== user.id) {
          activeCollaborators.push({
            userId: uid,
            fullName: entry.fullName,
            email: entry.email,
            focus: entry.focus,
          });
        }
      });
    }

    let collaboratorRole = 'VIEWER';
    if (user) {
      if (poll.creatorId === user.id || user.role === 'ADMIN') {
        collaboratorRole = 'OWNER';
      } else {
        const collab = poll.collaborators.find((c: any) => c.userId === user.id);
        if (collab) {
          collaboratorRole = collab.role === 'CO_EDITOR' || collab.role === 'EDITOR' ? 'EDITOR' : 'VIEWER';
        }
      }
    }

    // Validate if collaborations feature is allowed for both the poll creator and the current logged-in user
    let creatorCollaborationAllowed = true;
    let userCollaborationAllowed = true;

    if (poll.creatorId) {
      const creatorAccess = await checkFeatureAccess(poll.creatorId, 'collaborations');
      creatorCollaborationAllowed = creatorAccess.allowed;
    }
    if (user) {
      const userAccess = await checkFeatureAccess(user.id, 'collaborations');
      userCollaborationAllowed = userAccess.allowed;
    }

    return NextResponse.json({
      success: true,
      poll: cleanedPoll,
      isOwner: isCreatorOrAdmin,
      isCollaborator: !!isCollaborator,
      collaboratorRole,
      activeCollaborators,
      creatorCollaborationAllowed,
      userCollaborationAllowed
    });
  } catch (error: any) {
    console.error('Fetch Poll API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE: Deletes a poll by ID.
 * Allowed only for the creator or an admin.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { collaborators: true }
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    const collaborator = poll.collaborators.find((c: any) => c.userId === user.id);
    const isCollaborator = !!collaborator;
    if (poll.creatorId !== user.id && user.role !== 'ADMIN' && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (collaborator && collaborator.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden: Viewer access is read-only' }, { status: 403 });
    }

    // Before deleting, persist a deletion-history entry so quota tracking
    // and the "Deleted Items" ledger can still count this creation.
    await prisma.deletedPoll.create({
      data: {
        title: poll.title,
        pollType: poll.pollType,
        creatorId: poll.creatorId,
      },
    });

    await prisma.poll.delete({
      where: { id: pollId },
    });

    // Write audit log if deleted by admin overriding
    if (user.role === 'ADMIN' && poll.creatorId !== user.id) {
      await prisma.auditLog.create({
        data: {
          action: 'DELETE_POLL',
          adminId: user.id,
          pollId: pollId,
          details: `Admin deleted poll: "${poll.title}" (creatorId: ${poll.creatorId})`,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Poll deleted successfully' });
  } catch (error: any) {
    console.error('Delete Poll API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH: Updates a poll's status or configuration.
 * e.g., Transitioning from DRAFT -> ACTIVE or ending early.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pollId } = await params;
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { allowedVoters: true, votes: true, settings: true, collaborators: true },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Only creator, admin, or collaborator can update status
    const collaborator = poll.collaborators.find((c: any) => c.userId === user.id);
    const isCollaborator = !!collaborator;
    if (poll.creatorId !== user.id && user.role !== 'ADMIN' && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (collaborator && collaborator.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden: Viewer access is read-only' }, { status: 403 });
    }

    // Check Activity Restriction
    if (user.isActivityRestricted && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Your account activities have been restricted by the Administrator. You cannot edit this poll/survey.' },
        { status: 403 }
      );
    }

    const { 
      status, isResultPublic, title, description, posterUrl, 
      questionText, options, hideResultsUntilEnd, startTime, endTime,
      publicShowStats, publicShowCharts, publicShowMaps,
      enableConfidenceSlider, postSurveyAction,
      enableDragAndDropPodium, enableHotStreaks, enableLiveTicker,
      enableFomoPopups, enableSmartDebrief, leaderboardVisibility,
      enablePreferenceFlowMap, enableHeadToHeadMatrix, enableConsensusScore,
      enablePolarizationDetector, enableKingmakerAnalysis, enableRankHeatmap,
      enableRankConfidence, enableScenarioSimulator, enableTieBreakerEngine,
      rankedTieBreakerRule, enableRankCompleteness, rankedCompletenessRule,
      enablePodiumResults, enableCoalitionFinder, enableMinorityProtection,
      enableAuditReplay,
      // Single Choice features
      enableQuadraticVoting, enableAiProjection, enableCohortCrossTab,
      enableSentimentChat, enableSwingMap,
      // Knockout features
      enableBracketPredictions, enableDoubleElimination, enableUnderdogTracker,
      enableOptionStatsCards, enableSuddenDeath,
      // Exam-specific settings
      resultsReleased, examTimerDuration, enableProctorCamera,
      enableProctorMicrophone, proctorDriveFolderUrl,
      enableAutoSubmitOnTabLeave, enableAutoSubmitOnCacheClear,
      enableAutoSubmitOnLeave,
      verificationMethod, verificationType,
      // White label custom branding settings
      enableCustomBranding, customLogoUrl, customBrandingText,
      // Custom theme and save/resume fields
      customTheme, enableSaveAndResumeLater, studentWhiteboardDriveUrl,
      questions,
      // Full-wizard draft save fields
      isOpenVoting, isAnonymous,
      allowedVoters: allowedVotersPayload,
      identifierLabel, confirmer1Label, confirmer2Label,
    } = await req.json();

    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }
    if (isResultPublic !== undefined) {
      updateData.isResultPublic = !!isResultPublic;
    }
    if (title) {
      updateData.title = title;
    }
    if (description) {
      updateData.description = description;
    }
    if (posterUrl !== undefined) {
      updateData.posterUrl = posterUrl;
    }
    if (isOpenVoting !== undefined) {
      updateData.isOpenVoting = !!isOpenVoting;
    }
    if (isAnonymous !== undefined) {
      updateData.isAnonymous = !!isAnonymous;
    }
    if (identifierLabel) {
      updateData.identifierLabel = identifierLabel;
    }
    if (confirmer1Label) {
      updateData.confirmer1Label = confirmer1Label;
    }
    if (confirmer2Label !== undefined) {
      updateData.confirmer2Label = confirmer2Label;
    }
    const originalStartTime = poll.startTime;
    const originalEndTime = poll.endTime;

    let scheduleUpdated = false;
    let newStartVal: Date | null = null;
    let newEndVal: Date | null = null;

    if (startTime) {
      newStartVal = new Date(startTime);
      updateData.startTime = newStartVal;
      if (!originalStartTime || originalStartTime.getTime() !== newStartVal.getTime()) {
        scheduleUpdated = true;
      }
    }
    if (endTime) {
      newEndVal = new Date(endTime);
      updateData.endTime = newEndVal;
      if (!originalEndTime || originalEndTime.getTime() !== newEndVal.getTime()) {
        scheduleUpdated = true;
      }
    }

    const updatedPoll = await prisma.$transaction(async (tx) => {
      // 1. Update Poll details
      const pollObj = await tx.poll.update({
        where: { id: pollId },
        data: updateData,
      });

      // Update PollSettings
      const settingsPayload: any = {};
      if (hideResultsUntilEnd !== undefined) settingsPayload.hideResultsUntilEnd = !!hideResultsUntilEnd;
      if (publicShowStats !== undefined) settingsPayload.publicShowStats = !!publicShowStats;
      if (publicShowCharts !== undefined) settingsPayload.publicShowCharts = !!publicShowCharts;
      if (publicShowMaps !== undefined) settingsPayload.publicShowMaps = !!publicShowMaps;
      if (enableConfidenceSlider !== undefined) settingsPayload.enableConfidenceSlider = !!enableConfidenceSlider;
      if (postSurveyAction !== undefined) settingsPayload.postSurveyAction = postSurveyAction;
      if (enableDragAndDropPodium !== undefined) settingsPayload.enableDragAndDropPodium = !!enableDragAndDropPodium;
      if (enableHotStreaks !== undefined) settingsPayload.enableHotStreaks = !!enableHotStreaks;
      if (enableLiveTicker !== undefined) settingsPayload.enableLiveTicker = !!enableLiveTicker;
      if (enableFomoPopups !== undefined) settingsPayload.enableFomoPopups = !!enableFomoPopups;
      if (enableSmartDebrief !== undefined) settingsPayload.enableSmartDebrief = !!enableSmartDebrief;
      if (leaderboardVisibility !== undefined) settingsPayload.leaderboardVisibility = leaderboardVisibility;
      if (enablePreferenceFlowMap !== undefined) settingsPayload.enablePreferenceFlowMap = !!enablePreferenceFlowMap;
      if (enableHeadToHeadMatrix !== undefined) settingsPayload.enableHeadToHeadMatrix = !!enableHeadToHeadMatrix;
      if (enableConsensusScore !== undefined) settingsPayload.enableConsensusScore = !!enableConsensusScore;
      if (enablePolarizationDetector !== undefined) settingsPayload.enablePolarizationDetector = !!enablePolarizationDetector;
      if (enableKingmakerAnalysis !== undefined) settingsPayload.enableKingmakerAnalysis = !!enableKingmakerAnalysis;
      if (enableRankHeatmap !== undefined) settingsPayload.enableRankHeatmap = !!enableRankHeatmap;
      if (enableRankConfidence !== undefined) settingsPayload.enableRankConfidence = !!enableRankConfidence;
      if (enableScenarioSimulator !== undefined) settingsPayload.enableScenarioSimulator = !!enableScenarioSimulator;
      if (enableTieBreakerEngine !== undefined) settingsPayload.enableTieBreakerEngine = !!enableTieBreakerEngine;
      if (rankedTieBreakerRule !== undefined) settingsPayload.rankedTieBreakerRule = rankedTieBreakerRule;
      if (enableRankCompleteness !== undefined) settingsPayload.enableRankCompleteness = !!enableRankCompleteness;
      if (rankedCompletenessRule !== undefined) settingsPayload.rankedCompletenessRule = rankedCompletenessRule;
      if (enablePodiumResults !== undefined) settingsPayload.enablePodiumResults = !!enablePodiumResults;
      if (enableCoalitionFinder !== undefined) settingsPayload.enableCoalitionFinder = !!enableCoalitionFinder;
      if (enableMinorityProtection !== undefined) settingsPayload.enableMinorityProtection = !!enableMinorityProtection;
      if (enableAuditReplay !== undefined) settingsPayload.enableAuditReplay = !!enableAuditReplay;
      // Single Choice features
      if (enableQuadraticVoting !== undefined) settingsPayload.enableQuadraticVoting = !!enableQuadraticVoting;
      if (enableAiProjection !== undefined) settingsPayload.enableAiProjection = !!enableAiProjection;
      if (enableCohortCrossTab !== undefined) settingsPayload.enableCohortCrossTab = !!enableCohortCrossTab;
      if (enableSentimentChat !== undefined) settingsPayload.enableSentimentChat = !!enableSentimentChat;
      if (enableSwingMap !== undefined) settingsPayload.enableSwingMap = !!enableSwingMap;
      // Knockout features
      if (enableBracketPredictions !== undefined) settingsPayload.enableBracketPredictions = !!enableBracketPredictions;
      if (enableDoubleElimination !== undefined) settingsPayload.enableDoubleElimination = !!enableDoubleElimination;
      if (enableUnderdogTracker !== undefined) settingsPayload.enableUnderdogTracker = !!enableUnderdogTracker;
      if (enableOptionStatsCards !== undefined) settingsPayload.enableOptionStatsCards = !!enableOptionStatsCards;
      if (enableSuddenDeath !== undefined) settingsPayload.enableSuddenDeath = !!enableSuddenDeath;
      // Exam features
      if (resultsReleased !== undefined) settingsPayload.resultsReleased = !!resultsReleased;
      if (examTimerDuration !== undefined) settingsPayload.examTimerDuration = examTimerDuration ? parseInt(String(examTimerDuration), 10) : null;
      if (enableProctorCamera !== undefined) settingsPayload.enableProctorCamera = !!enableProctorCamera;
      if (enableProctorMicrophone !== undefined) settingsPayload.enableProctorMicrophone = !!enableProctorMicrophone;
      if (proctorDriveFolderUrl !== undefined) settingsPayload.proctorDriveFolderUrl = proctorDriveFolderUrl;
      if (enableAutoSubmitOnTabLeave !== undefined) settingsPayload.enableAutoSubmitOnTabLeave = !!enableAutoSubmitOnTabLeave;
      if (enableAutoSubmitOnCacheClear !== undefined) settingsPayload.enableAutoSubmitOnCacheClear = !!enableAutoSubmitOnCacheClear;
      if (enableAutoSubmitOnLeave !== undefined) settingsPayload.enableAutoSubmitOnLeave = !!enableAutoSubmitOnLeave;
      if (verificationMethod !== undefined) settingsPayload.verificationMethod = verificationMethod;
      if (verificationType !== undefined) settingsPayload.verificationType = verificationType;
      // White label custom branding settings
      if (enableCustomBranding !== undefined) settingsPayload.enableCustomBranding = !!enableCustomBranding;
      if (customLogoUrl !== undefined) settingsPayload.customLogoUrl = customLogoUrl;
      if (customBrandingText !== undefined) settingsPayload.customBrandingText = customBrandingText;
      if (customTheme !== undefined) settingsPayload.customTheme = customTheme;
      if (enableSaveAndResumeLater !== undefined) settingsPayload.enableSaveAndResumeLater = !!enableSaveAndResumeLater;
      if (studentWhiteboardDriveUrl !== undefined) settingsPayload.studentWhiteboardDriveUrl = studentWhiteboardDriveUrl;

      if (Object.keys(settingsPayload).length > 0) {
        await tx.pollSettings.upsert({
          where: { pollId: pollId },
          create: {
            pollId: pollId,
            hideResultsUntilEnd: hideResultsUntilEnd !== undefined ? !!hideResultsUntilEnd : false,
            publicShowStats: publicShowStats !== undefined ? !!publicShowStats : true,
            publicShowCharts: publicShowCharts !== undefined ? !!publicShowCharts : true,
            publicShowMaps: publicShowMaps !== undefined ? !!publicShowMaps : true,
            enableConfidenceSlider: enableConfidenceSlider !== undefined ? !!enableConfidenceSlider : false,
            postSurveyAction: postSurveyAction || null,
            enableDragAndDropPodium: enableDragAndDropPodium !== undefined ? !!enableDragAndDropPodium : false,
            enableHotStreaks: enableHotStreaks !== undefined ? !!enableHotStreaks : false,
            enableLiveTicker: enableLiveTicker !== undefined ? !!enableLiveTicker : false,
            enableFomoPopups: enableFomoPopups !== undefined ? !!enableFomoPopups : false,
            enableSmartDebrief: enableSmartDebrief !== undefined ? !!enableSmartDebrief : false,
            leaderboardVisibility: leaderboardVisibility || "HIDDEN",
            enablePreferenceFlowMap: enablePreferenceFlowMap !== undefined ? !!enablePreferenceFlowMap : false,
            enableHeadToHeadMatrix: enableHeadToHeadMatrix !== undefined ? !!enableHeadToHeadMatrix : false,
            enableConsensusScore: enableConsensusScore !== undefined ? !!enableConsensusScore : false,
            enablePolarizationDetector: enablePolarizationDetector !== undefined ? !!enablePolarizationDetector : false,
            enableKingmakerAnalysis: enableKingmakerAnalysis !== undefined ? !!enableKingmakerAnalysis : false,
            enableRankHeatmap: enableRankHeatmap !== undefined ? !!enableRankHeatmap : false,
            enableRankConfidence: enableRankConfidence !== undefined ? !!enableRankConfidence : false,
            enableScenarioSimulator: enableScenarioSimulator !== undefined ? !!enableScenarioSimulator : false,
            enableTieBreakerEngine: enableTieBreakerEngine !== undefined ? !!enableTieBreakerEngine : false,
            rankedTieBreakerRule: rankedTieBreakerRule || "FIRST_PLACE",
            enableRankCompleteness: enableRankCompleteness !== undefined ? !!enableRankCompleteness : false,
            rankedCompletenessRule: rankedCompletenessRule || "PARTIAL",
            enablePodiumResults: enablePodiumResults !== undefined ? !!enablePodiumResults : false,
            enableCoalitionFinder: enableCoalitionFinder !== undefined ? !!enableCoalitionFinder : false,
            enableMinorityProtection: enableMinorityProtection !== undefined ? !!enableMinorityProtection : false,
            enableAuditReplay: enableAuditReplay !== undefined ? !!enableAuditReplay : false,
            // Exam settings
            resultsReleased: resultsReleased !== undefined ? !!resultsReleased : false,
            examTimerDuration: examTimerDuration ? parseInt(String(examTimerDuration), 10) : null,
            enableProctorCamera: enableProctorCamera !== undefined ? !!enableProctorCamera : false,
            enableProctorMicrophone: enableProctorMicrophone !== undefined ? !!enableProctorMicrophone : false,
            proctorDriveFolderUrl: proctorDriveFolderUrl || null,
            enableAutoSubmitOnTabLeave: enableAutoSubmitOnTabLeave !== undefined ? !!enableAutoSubmitOnTabLeave : false,
            enableAutoSubmitOnCacheClear: enableAutoSubmitOnCacheClear !== undefined ? !!enableAutoSubmitOnCacheClear : false,
            enableAutoSubmitOnLeave: enableAutoSubmitOnLeave !== undefined ? !!enableAutoSubmitOnLeave : false,
            verificationMethod: verificationMethod || "EMAIL",
            verificationType: verificationType || "OTP",
            // White label custom branding settings
            enableCustomBranding: enableCustomBranding !== undefined ? !!enableCustomBranding : false,
            customLogoUrl: customLogoUrl || null,
            customBrandingText: customBrandingText || null,
            customTheme: customTheme || "MIDNIGHT",
            enableSaveAndResumeLater: enableSaveAndResumeLater !== undefined ? !!enableSaveAndResumeLater : false,
            studentWhiteboardDriveUrl: studentWhiteboardDriveUrl || null,
          },
          update: settingsPayload,
        });
      }

      // 2. Rewrite entire questions and options if sent
      if (questions && Array.isArray(questions)) {
        // Delete all existing questions for this poll (cascade deletes options too!)
        await tx.question.deleteMany({
          where: { pollId: pollId }
        });

        // Recreate them from the array
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const createdQ = await tx.question.create({
            data: {
              pollId: pollId,
              questionText: q.questionText || '',
              type: q.type || 'SINGLE',
              pageNumber: q.pageNumber || 1,
              order: q.order || (i + 1),
              marks: q.marks !== undefined ? parseFloat(String(q.marks)) : 0.0,
              inputConstraint: q.inputConstraint || 'NONE',
              enableWhiteboard: !!q.enableWhiteboard,
              correctAnswer: q.correctAnswer || null,
              correctAnswers: q.correctAnswers || null,
              logicRules: q.logicRules || null,
            }
          });

          // Create options for this question if options are specified
          if (q.options && Array.isArray(q.options)) {
            for (const opt of q.options) {
              const optText = typeof opt === 'string' ? opt : (opt.text || '');
              await tx.option.create({
                data: {
                  questionId: createdQ.id,
                  text: optText,
                }
              });
            }
          }
        }
      } else if (questionText) {
        // Legacy fallback
        const question = await tx.question.findFirst({
          where: { pollId },
        });
        if (question) {
          await tx.question.update({
            where: { id: question.id },
            data: { questionText },
          });

          if (options && Array.isArray(options)) {
            for (const opt of options) {
              if (opt.id && opt.text) {
                await tx.option.update({
                  where: { id: opt.id },
                  data: { text: opt.text },
                });
              }
            }
          }
        }
      }

      // Rewrite allowed voters if provided
      if (allowedVotersPayload !== undefined && Array.isArray(allowedVotersPayload)) {
        await tx.allowedVoter.deleteMany({ where: { pollId } });
        if (allowedVotersPayload.length > 0) {
          await tx.allowedVoter.createMany({
            data: allowedVotersPayload.map((v: any) => ({
              pollId,
              identifier: v.identifier || '',
              confirmer1: v.confirmer1 || '',
              confirmer2: v.confirmer2 || '',
              email: v.email || '',
              phone: v.phone || null,
              password: v.password || null,
              voterAuthType: v.voterAuthType || 'GLOBAL',
            }))
          });
        }
      }

      // Generate audit activity log entry inside the transaction
      const changesList: string[] = [];
      if (title && title !== poll.title) {
        changesList.push(`Title changed from "${poll.title}" to "${title}"`);
      }
      if (description && description !== poll.description) {
        changesList.push(`Description updated`);
      }
      if (questions && Array.isArray(questions)) {
        changesList.push(`Updated questions layout (total ${questions.length} questions)`);
      }
      if (status && status !== poll.status) {
        changesList.push(`Status updated from ${poll.status} to ${status}`);
      }

      if (changesList.length > 0) {
        await tx.auditLog.create({
          data: {
            action: 'COEDIT_UPDATE',
            adminId: user.id,
            pollId: pollId,
            details: changesList.join('; '),
          }
        });
      }

      return pollObj;
    }, {
      maxWait: 15000,
      timeout: 20000,
    });

    // Audit logs for admin actions
    if (user.role === 'ADMIN' && poll.creatorId !== user.id) {
      await prisma.auditLog.create({
        data: {
          action: 'MODIFY_POLL',
          adminId: user.id,
          pollId: pollId,
          details: `Admin patched poll. Status: ${status || 'unchanged'}. Public: ${isResultPublic !== undefined ? isResultPublic : 'unchanged'}`,
        },
      });
    }

    // If poll was just moved to ACTIVE (published) and closed voting, invite voters now
    if (status === 'ACTIVE' && poll.status === 'DRAFT' && !poll.isOpenVoting && poll.allowedVoters.length) {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      const inviteLink = `${protocol}://${host}/poll/${poll.id}`;

      poll.allowedVoters.forEach((voter) => {
        sendPollInvitationEmail(
          voter.email,
          poll.title,
          inviteLink,
          poll.description,
          poll.pollType
        ).catch((e) => console.error('Failed to send invite email to:', voter.email, e));
      });
    }

    // If poll was just moved to ENDED (closed), send poll closed notification to everyone
    if (status === 'ENDED' && poll.status !== 'ENDED') {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      const reportUrl = `${protocol}://${host}/poll/${poll.id}`;

      if (!poll.isOpenVoting && poll.allowedVoters.length) {
        poll.allowedVoters.forEach((voter) => {
          sendPollClosedEmail({
            email: voter.email,
            pollTitle: poll.title,
            reportUrl,
            pollType: poll.pollType,
          }).catch((e) => console.error('Failed to send poll closed email:', e));
        });
      } else if (poll.votes && poll.votes.length) {
        const uniqueVoters = Array.from(new Set(poll.votes.map((v) => v.email).filter(Boolean)));
        uniqueVoters.forEach((email) => {
          sendPollClosedEmail({
            email: email as string,
            pollTitle: poll.title,
            reportUrl,
            pollType: poll.pollType,
          }).catch((e) => console.error('Failed to send poll closed email:', e));
        });
      }
    }

    if (scheduleUpdated) {
      const finalStart = newStartVal || originalStartTime;
      const finalEnd = newEndVal || originalEndTime;
      
      if (finalStart && finalEnd) {
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const pollUrl = `${protocol}://${host}/poll/${pollId}`;

        if (!poll.isOpenVoting && poll.allowedVoters.length) {
          poll.allowedVoters.forEach((voter) => {
            sendPollScheduleUpdatedEmail({
              email: voter.email,
              pollTitle: poll.title,
              newStartTime: finalStart,
              newEndTime: finalEnd,
              pollUrl,
            }).catch((e) => console.error('Failed to send schedule update email to voter:', voter.email, e));
          });
        } else if (poll.votes && poll.votes.length) {
          const uniqueVoters = Array.from(new Set(poll.votes.map((v) => v.email).filter(Boolean)));
          uniqueVoters.forEach((email) => {
            sendPollScheduleUpdatedEmail({
              email: email as string,
              pollTitle: poll.title,
              newStartTime: finalStart,
              newEndTime: finalEnd,
              pollUrl,
            }).catch((e) => console.error('Failed to send schedule update email to voter:', email, e));
          });
        }
      }
    }

    const shouldSendReleaseEmails = resultsReleased === true && (!poll.settings || !poll.settings.resultsReleased);
    if (shouldSendReleaseEmails) {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      
      poll.votes.forEach((vote) => {
        if (!vote.email) return;
        
        try {
          const answersObj = typeof vote.answers === 'string' ? JSON.parse(vote.answers) : vote.answers;
          const examScore = answersObj?.__examScore || { earned: 0.0, total: 0.0 };
          
          const analysisUrl = `${protocol}://${host}/poll/${pollId}/analysis?email=${encodeURIComponent(vote.email)}`;
          
          sendExamResultsReleasedEmail({
            email: vote.email,
            pollTitle: poll.title,
            scoreEarned: examScore.earned || 0.0,
            scoreTotal: examScore.total || 0.0,
            analysisUrl,
          }).catch(err => console.error(`Failed to send result release email to ${vote.email}:`, err));
        } catch (e) {
          console.error(`Failed to parse vote answers for email to ${vote.email}:`, e);
        }
      });
    }

    // Trigger dynamic socket update to all connected poll dashboard clients
    if ((global as any).io) {
      (global as any).io.to(`poll-${pollId}`).emit('poll-status-update', { status: updatedPoll.status });
    }

    return NextResponse.json({ success: true, poll: updatedPoll });
  } catch (error: any) {
    console.error('Update Poll API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
