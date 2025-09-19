import { collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.db;
let cachedData = {}; // temporary storage

// Step 1: Click Pay → Generate QR
document.getElementById("payBtn").addEventListener("click", function() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const events = [...document.querySelectorAll('input[name="event"]:checked')].map(e => e.value);

  if (!name || !email || !phone) {
    showMessage("❌ Please fill all details.", "error");
    return;
  }
  if (events.length === 0) {
    showMessage("❌ Please select at least one event.", "error");
    return;
  }

  // Calculate amount
  let amount = (events.length === 4) ? 99 : events.length * 29;
  document.getElementById("amount").innerText = "Total Amount: ₹" + amount;

  // Generate QR
  const upiLink = `upi://pay?pa=9474080663@slc&pn=Organizer&am=${amount}&cu=INR`;
  const qrCodeContainer = document.getElementById("qrcode");
  qrCodeContainer.innerHTML = "";
  const canvas = document.createElement("canvas");
  QRCode.toCanvas(canvas, upiLink, (error) => {
    if (error) console.error(error);
    qrCodeContainer.appendChild(canvas);
  });

  // Store user data temporarily
  cachedData = { name, email, phone, events, amount };

  // Show payment section
  document.getElementById("paymentSection").style.display = "block";
  showMessage("✅ QR Generated. Pay and enter UTR.", "success");
});

// Step 2: Confirm Registration → Save only if UTR filled & unique
document.getElementById("eventForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const utr = document.getElementById("utr").value.trim();
  if (!utr) {
    showMessage("❌ Please enter your UTR after payment.", "error");
    return;
  }

  try {
    // Check if UTR already exists
    const q = query(collection(db, "registrations"), where("utr", "==", utr));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      showMessage("⚠️ This UTR is already used. Enter a valid one.", "error");
      return;
    }

    // Save to Firebase
    await addDoc(collection(db, "registrations"), {
      ...cachedData,
      events: cachedData.events.join(", "),
      utr: utr,
      timestamp: new Date()
    });

    showMessage("🎉 Registration confirmed! Data saved to Firebase.", "success");
    document.getElementById("eventForm").reset();
    document.getElementById("qrcode").innerHTML = "";
    document.getElementById("paymentSection").style.display = "none";
    cachedData = {};

  } catch (err) {
    console.error("Error saving: ", err);
    showMessage("⚠️ Failed to save: " + err.message, "error");
  }
});

// Helper: Show message
function showMessage(msg, type) {
  const box = document.getElementById("message");
  box.style.display = "block";
  box.className = "message " + type;
  box.innerText = msg;
}
