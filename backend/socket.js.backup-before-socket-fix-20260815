    /*
     * Register this socket in a private user room.
     */
    socket.join(`user_${socket.user.id}`);

    /*
     * WebRTC Video Call Signaling
     */

    socket.on(
      "callUser",
      ({
        userToCall,
        offer,
        conversationId,
      }) => {
        if (!userToCall || !offer) {
          return;
        }

        io.to(`user_${userToCall}`).emit(
          "incomingCall",
          {
            from: socket.user.id,
            callerName:
              socket.user.full_name ||
              socket.user.email ||
              "PropertyNestHomes User",
            offer,
            conversationId,
          }
        );
      }
    );

    socket.on(
      "answerCall",
      ({
        callerId,
        answer,
        conversationId,
      }) => {
        if (!callerId || !answer) {
          return;
        }

        io.to(`user_${callerId}`).emit(
          "callAccepted",
          {
            from: socket.user.id,
            answer,
            conversationId,
          }
        );
      }
    );

    socket.on(
      "iceCandidate",
      ({
        targetUserId,
        candidate,
        conversationId,
      }) => {
        if (!targetUserId || !candidate) {
          return;
        }

        io.to(`user_${targetUserId}`).emit(
          "iceCandidate",
          {
            from: socket.user.id,
            candidate,
            conversationId,
          }
        );
      }
    );

    socket.on(
      "endCall",
      ({
        targetUserId,
        conversationId,
      }) => {
        if (!targetUserId) {
          return;
        }

        io.to(`user_${targetUserId}`).emit(
          "callEnded",
          {
            from: socket.user.id,
            conversationId,
          }
        );
      }
    );
