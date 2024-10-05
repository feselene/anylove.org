// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyAr9RlM8ONl3IcXU5Ner5XIXmxhUqkd0bo",
	authDomain: "anyloveorg.firebaseapp.com",
	databaseURL: "https://anyloveorg-default-rtdb.firebaseio.com",
	projectId: "anyloveorg",
	storageBucket: "anyloveorg.appspot.com",
	messagingSenderId: "611203636730",
	appId: "1:611203636730:web:34ce602a44c6defdd45843",
	measurementId: "G-LKZNJPTG0F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Video elements from the HTML
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startCallButton = document.getElementById('startCall');

let localStream;
let peerConnection;
const servers = {
	iceServers: [
		{ urls: 'stun:stun.l.google.com:19302' }
	]
};

// Function to handle the video call setup and start
startCallButton.onclick = async () => {
	// Get user media for video and audio
	localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
	localVideo.srcObject = localStream;
	
	// Create a new RTCPeerConnection
	peerConnection = new RTCPeerConnection(servers);
	localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
	
	// Set remote video stream when received
	peerConnection.ontrack = (event) => {
		remoteVideo.srcObject = event.streams[0];
	};
	
	// Send ICE candidates to Firebase
	peerConnection.onicecandidate = event => {
		if (event.candidate) {
			const candidateData = event.candidate.toJSON();
			database.ref("/candidates").push(candidateData);
		}
	};
	
	// Create an offer and save it to Firebase
	const offer = await peerConnection.createOffer();
	await peerConnection.setLocalDescription(offer);
	database.ref("/offer").set({
		offer: peerConnection.localDescription.toJSON()
	});
	
	listenForAnswer();
};

// Listen for an answer from Firebase
function listenForAnswer() {
	database.ref("/answer").on('value', async snapshot => {
		const answerData = snapshot.val();
		if (!answerData) return;
		const answerDescription = new RTCSessionDescription(answerData.answer);
		await peerConnection.setRemoteDescription(answerDescription);
	});
}

// Listen for ICE candidates from Firebase and add them to the peer connection
database.ref("/candidates").on('child_added', async snapshot => {
	const candidateData = snapshot.val();
	if (!candidateData) return;
	const candidate = new RTCIceCandidate(candidateData);
	await peerConnection.addIceCandidate(candidate);
});
