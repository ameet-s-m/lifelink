let messages = [];

function showTab(id) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  // Highlight current tab
  const navBtns = document.querySelectorAll('nav button');
  if(id==='chat')navBtns[0].classList.add('active');
  if(id==='sos')navBtns[1].classList.add('active');
  if(id==='connect')navBtns[2].classList.add('active');
}

// Messaging / Chat
const messagesDiv = document.getElementById('messages');
const msgForm = document.getElementById('msgForm');
const msgInput = document.getElementById('msgInput');

// Initial welcome messages
messages.push({from: 'other', text: "Welcome! Your messages are secure. An admin will reply soon."});

function renderMessages() {
  messagesDiv.innerHTML = '';
  messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'msg ' + msg.from;
    div.innerHTML = `<span class="bubble">${msg.text}</span>`;
    messagesDiv.appendChild(div);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

msgForm.onsubmit = e => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if(!text) return;
  messages.push({from: 'me', text});
  renderMessages();
  msgInput.value = '';
  // DEMO: Mesh relay simulation
  setTimeout(() => {
    messages.push({from: 'other', text: "Message relayed via mesh and seen by admin."});
    renderMessages();
  }, 800);
};
renderMessages();

// SOS/location
function sendSOS() {
  const status = document.getElementById('sosStatus');
  status.textContent = "Getting your location...";
  if (!navigator.geolocation) {
    status.textContent = "Geolocation not supported.";
    return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    const {latitude, longitude} = pos.coords;
    status.innerHTML = `SOS sent! <br>Location: <b>${latitude.toFixed(5)}, ${longitude.toFixed(5)}</b>`;
    // In real app: relay via mesh to admin/govt
    messages.push({from: 'me', text: `SOS! Location: (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`});
    renderMessages();
  }, err => {
    status.textContent = "Location error: " + err.message;
  });
}

// Bluetooth (browser demo only)
async function connectBluetooth() {
  const info = document.getElementById('bluetoothInfo');
  document.getElementById('btStatus').textContent = "Scanning...";
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['battery_service']
    });
    document.getElementById('btStatus').textContent = "Connected: " + device.name;
    info.innerHTML = `<b>Device:</b> ${device.name || "(no name)"}<br>
      <b>ID:</b> ${device.id}
      <br><i>Bluetooth mesh is a demo here. For direct device-to-device, use our mobile app.</i>`;
  } catch(e) {
    document.getElementById('btStatus').textContent = "Not Connected";
    info.textContent = "Connection failed: " + e.message;
  }
}
