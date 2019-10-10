const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cheerio = require('cheerio')
const fetch = require('node-fetch')

admin.initializeApp(functions.config().firebase)
const db = admin.firestore()

/**
 * @param {EventContext} context
 */
function throwIfNotAuthenticated (context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('permission-denied', 'Not Authenticated.')
  }
}

/**
 * @param {string} message
 * @returns {string}
 */
async function getPreviewImage (message) {
  const match = message.match(/https:\/\/gph.is\/g\/\w+/)
  if (!match) return null

  const pageSource = await(await fetch(match[0])).text()

  const $ = cheerio.load(pageSource)
  return $(`meta[name=og:image]`).attr('content')
}
 
// Callable Functions

exports.sendMessage = functions.https.onCall(async (data, context) => {
  console.log('Message sent:', data)
  throwIfNotAuthenticated(context)

  const roomRef = db.collection('chatrooms').doc(data.room)
  const roomSnap = await roomRef.get()

  if (!roomSnap.data().openWrite) {
    const memberSnap = await roomRef.collection('members').doc(context.auth.uid).get()
    if (!memberSnap.exists) throw new functions.https.HttpsError('permission-denied', 'Not Member of closed room.')
  }

  return roomRef.collection('messages').add({
    author: db.collection('users').doc(context.auth.uid),
    content: data.content,
    posted: admin.firestore.FieldValue.serverTimestamp()
  })
})

exports.registerForTopic = functions.https.onCall(async (data, context) => {
  return admin.messaging().subscribeToTopic(data.token, data.topic)
})

exports.unregisterFromTopic = functions.https.onCall(async (data, context) => {
  return admin.messaging().unsubscribeFromTopic(data.token, data.topic)
})

// Trigger Functions

exports.createNewUser = functions.auth.user().onCreate(async (user, context) => {
  await db.collection('users').doc(user.uid).set({
    displayName: user.displayName,
    email: user.email,
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    status: ''
  })
})

exports.sendNotificationForNewMessages = functions.firestore
  .document('/chatrooms/{room}/messages/{message}').onCreate(async (snap, context) => {
    const message = snap.data()
    const author = (await message.author.get()).data()

    return admin.messaging().sendToTopic(context.params.room, {
      data: {
        room: context.params.room,
        authorId: message.author.id,
        authorName: author.displayName,
        content: message.content
      }
    })
  })
