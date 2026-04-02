'use strict';

const { emitter } = require('./matchService');
const { sendMatchNotificationEmail } = require('../utils/emailService');
const User = require('../models/User'); // adjust path if needed

const initEmailListeners = () => {
  emitter.on('match:found', async (payload) => {
    try {
      // Log event (for debugging)
      console.log('[EmailService] match:found event received:', {
        postTitle: payload.sourcePost.title,
        authorId: payload.sourcePost.authorId,
        matchCount: payload.matchedPosts.length,
        topScore: payload.topScore
      });

      // Fetch user from database
      const user = await User.findById(payload.sourcePost.authorId);

      if (!user || !user.email) {
        console.log('[EmailService] No user/email found for authorId:', payload.sourcePost.authorId);
        return;
      }

      const authorEmail = user.email;

      // Send email
      await sendMatchNotificationEmail(
        authorEmail,
        payload.sourcePost.title,
        payload.matchedPosts[0]?.title || 'Unknown match'
      );

      console.log('[EmailService] Match notification email sent');

    } catch (err) {
      console.error('[EmailService] Error sending match email:', err);
    }
  });

  console.log('[EmailService] Email notification listeners registered');
};

module.exports = { initEmailListeners };