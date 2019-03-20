const Vue = window.Vue
const firebase = window.firebase
const firebaseui = window.firebaseui

const db = firebase.firestore()

// This Key is unique for each Firebase Project
// It can be generated via Firebase Console -> settings -> cloud messaging -> web pus certificats
const webPushPublicKey = 'BM5-UTipF8vci0jGOK-gRubAEtr7vermG7pSvPCZZZ02dOkpxoc6BXz4N73B3H4Q_0u5_QW1GNQv0bidPkVuqBE'
firebase.messaging.isSupported() && firebase.messaging().usePublicVapidKey(webPushPublicKey)

// Make unhandled errors/rejected promises visible
const errorMessageDiv = document.getElementById('errorMessage')

window.onerror = err => {
  console.error(err)
  errorMessageDiv.textContent += err.reason ? err.reason : err.toString()
  errorMessageDiv.style.display = 'block'
}
window.addEventListener('unhandledrejection', window.onerror)

// Function Emulation for local testing
const functions = firebase.functions()
if (window.location.hostname === 'localhost') functions.emulatorOrigin = 'http://localhost:5001'

const data = {
  initialized: false,
  authenticating: false,
  user: null,
  users: {},
  roomName: 'welcome',
  room: {},
  members: [],
  messages: [],
  newMessageText: '',
  unsubscribers: {
    users: null,
    room: null,
    members: null,
    messages: null
  },
  readMessageCount: 1000,
  currentDate: new Date()
}

// Initialize Firebase Auth UI
const firebaseAuthUi = new firebaseui.auth.AuthUI(firebase.auth())

firebase.auth().onAuthStateChanged(user => {
  data.user = user
  data.initialized = true
})

const firebaseUiAuthConfig = {
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: () => {
      data.authenticating = false
      return false
    }
  }
}

if (firebaseAuthUi.isPendingRedirect()) {
  firebaseAuthUi.start('#authenticator', firebaseUiAuthConfig)
}

// Google Cloud Functions
const callSendMessage = firebase.functions().httpsCallable('sendMessage')
const callRegisterForTopic = firebase.functions().httpsCallable('registerForTopic')

// Vue Application
window.VueMain = new Vue({
  el: '#main',
  data,
  created () {
    this.loadUsers()
    if (this.initialized) this.loadRoom(this.roomName)

    // Computed functions depending on the current Date should only update once a minute
    window.setInterval(() => { this.currentDate = new Date() }, 60000)

    // This is called when the App has Focus and receives a notification
    firebase.messaging.isSupported() && firebase.messaging().onMessage(function (payload) {
      console.log('Message received. ', payload)
    })
  },
  computed: {
    messagesWithMeta () {
      return this.messages.map(m => ({
        ...m,
        timeString: this.formatTimestamp(m.posted),
        authorName: this.getDisplayName(m.author)
      }))
    }
  },
  watch: {
    initialized (val) {
      if (val) this.loadRoom(this.roomName)
    }
  },
  methods: {
    loadUsers () {
      if (this.unsubscribers.users) return

      this.unsubscribers.users = db.collection('users').onSnapshot(snap => {
        snap.forEach(u => { this.users[u.id] = u.data() })
      }, window.onerror)
    },

    async loadRoom (roomName) {
      // Onyl subscribe to messages in one room
      if (this.unsubscribers.room) this.unsubscribers.room()
      if (this.unsubscribers.members) this.unsubscribers.members()
      if (this.unsubscribers.messages) this.unsubscribers.messages()

      this.roomName = roomName
      this.room = {}
      this.messages = []
      this.members = []

      const roomRef = db.collection('chatrooms').doc(roomName)

      try {
        const snap = await roomRef.get()
        this.roomName = snap.id
        this.room = snap.data()
      } catch (err) {
        if (err.code === 'permission-denied') {
          this.messages.push({
            posted: {},
            content: 'You have no permission for this Chatroom',
            author: {}
          })
          return
        } else {
          throw err
        }
      }

      this.unsubscribers.room = roomRef.onSnapshot(snap => {
        this.roomName = snap.id
        this.room = snap.data()
      }, window.onerror)

      this.unsubscribers.members = roomRef.collection('members').onSnapshot(snap => {
        this.members = snap.docs.map(d => d.data())
      }, window.onerror)

      // Get the newest 100 Messages *TODO: Paginate older messages on scrolling upwards
      const messageSnap = await roomRef.collection('messages').orderBy('posted', 'desc').limit(100).get()
      this.messages = messageSnap.docs.map(d => d.data()).reverse()

      // Listen for all messages newer than the last Message received
      const lastMessageNum = this.messages.length - 1
      const lastDate = lastMessageNum >= 0 ? this.messages[lastMessageNum].posted.toDate() : new Date(0)

      this.unsubscribers.messages = roomRef.collection('messages')
        .where('posted', '>', lastDate).onSnapshot(async snap => {
          this.readMessageCount = this.messages.length
          snap.docChanges().filter(d => d.type === 'added').forEach(d => this.messages.push(d.doc.data()))
          await this.$nextTick()
          const messageWindow = this.$el.querySelector('.message-window')
          messageWindow.scroll(0, messageWindow.scrollHeight)
        }, window.onerror)

      // Scroll all the way down when the DOM is ready
      await this.$nextTick()
      const messageWindow = this.$el.querySelector('.message-window')
      messageWindow.scroll(0, messageWindow.scrollHeight)
    },

    sendMessage () {
      const content = this.newMessageText
      if (content === '') return

      this.newMessageText = ''
      callSendMessage({
        room: this.roomName,
        content
      })
    },

    async requestNotifications () {
      try {
        await firebase.messaging().requestPermission()
        await this.refreshNotificationToken()
        // TODO: Make State of Notifications visible in the UI & Provide way to unsubscribe

        // This could be called by firebase if the Token changes
        firebase.messaging().onTokenRefresh(this.refreshNotificationToken)
      } catch (err) {
        // This can also happen if the user does not grant us permission
        console.err('Unable to register for Notifications.', err)
      }
    },

    async refreshNotificationToken () {
      const currentToken = await firebase.messaging().getToken()

      if (currentToken) {
        await callRegisterForTopic({ token: currentToken, topic: this.roomName })
      }
    },

    startAuth () {
      this.authenticating = true
      firebaseAuthUi.start('#authenticator', firebaseUiAuthConfig)
    },
    stopAuth () {
      this.authenticating = false
    },

    getDisplayName (userRef) {
      const user = this.users[userRef.id]
      return user ? user.displayName : '???'
    },

    /**
     * @param time {Date}
     */
    formatTimestamp (timeObject) {
      const time = new Date(timeObject.seconds * 1000)
      const minutes = time.getMinutes()
      let timeString = '@' + time.getHours() + ':' + (minutes < 10 ? '0' : '') + minutes

      const timeDiffms = this.currentDate.getTime() - time.getTime()

      if (timeDiffms < 20 * 1000) {
        return 'just now'
      }
      if (timeDiffms > 24 * 3600 * 1000) {
        timeString = new Intl.DateTimeFormat(navigator.language,
          { day: 'numeric', month: 'long' }).format(time) +
          ' ' + timeString

        if (time.getFullYear() !== this.currentDate.getFullYear()) {
          timeString = this.currentDate.getFullYear() + ' - ' + timeString
        }

        return timeString
      }

      if (this.currentDate.getDate() !== time.getDate()) {
        return 'yesterday ' + timeString
      }

      return timeString
    }
  }
})
