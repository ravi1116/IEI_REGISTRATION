// Your unique Google Apps Script Web App URL is now included.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxtxbLa6uQcsKeoEvcjOtDLMsOOwW5zUEHivePgIulVRUY2ECP-0-ONH1Lp_LiyQzwf_w/exec";

let cachedData = {}; // temporary storage for form data

// --- Live Amount Calculation ---
const eventCheckboxes = document.querySelectorAll('input[name="event"]');
const liveAmountContainer = document.getElementById("liveAmountContainer");
const liveAmountEl = document.getElementById("liveAmount");

function updateLiveAmount() {
  const selectedEvents = [...document.querySelectorAll('input[name="event"]:checked')];
  if (selectedEvents.length === 0) {
    liveAmountContainer.style.display = "none";
    return;
  }
  const amount = (selectedEvents.length === 4) ? 99 : selectedEvents.length * 29;
  liveAmountEl.innerText = "₹" + amount;
  liveAmountContainer.style.display = "block";
}
eventCheckboxes.forEach(cb => cb.addEventListener("change", updateLiveAmount));


// Step 1: Click Pay → Generate QR
document.getElementById("payBtn").addEventListener("click", function() {
  const name = document.getElementById("name").value;
  const college = document.getElementById("college").value;
  const branch = document.getElementById("branch").value;
  const year = document.getElementById("year").value;
  const classRollno = document.getElementById("classRollno").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const events = [...document.querySelectorAll('input[name="event"]:checked')].map(e => e.value);

  if (!name || !college || !branch || !year || !classRollno || !email || !phone) {
    showMessage("❌ Please fill all personal details.", "error");
    return;
  }
  if (events.length === 0) {
    showMessage("❌ Please select at least one event.", "error");
    return;
  }

  let amount = (events.length === 4) ? 99 : events.length * 29;
  document.getElementById("amount").innerText = "Total Amount: ₹" + amount;

  const upiLink = `upi://pay?pa=9474080663@slc&pn=Organizer&am=${amount}&cu=INR`;
  const qrCodeContainer = document.getElementById("qrcode");
  qrCodeContainer.innerHTML = ""; // Clear previous QR
  const canvas = document.createElement("canvas");
  QRCode.toCanvas(canvas, upiLink, (error) => {
    if (error) console.error(error);
    qrCodeContainer.appendChild(canvas);
  });

  // Cache all the data to be sent later
  cachedData = { name, college, branch, year, classRollno, email, phone, events, amount };
  document.getElementById("paymentSection").style.display = "block";
  showMessage("✅ QR Generated. Complete payment and enter the UTR.", "success");
});

// Step 2: Confirm Registration → Send data to Google Sheet
document.getElementById("eventForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const submitButton = e.target.querySelector('button[type="submit"]');

  const utr = document.getElementById("utr").value.trim();
  if (!utr) {
    showMessage("❌ Please enter your UTR after payment.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';

  const finalData = {
    ...cachedData,
    utr: utr,
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
  };

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalData),
    });

    const result = await response.json();

    if (result.status === "success") {
      const successMessage = `🎉 Registration confirmed! <a href="https://chat.whatsapp.com/CbcwCDG529b6qaCqbu4wi5" target="_blank">Click here to join the WhatsApp group.</a>`;
      showMessage(successMessage, "success");
      
      document.getElementById("eventForm").reset();
      document.getElementById("qrcode").innerHTML = "";
      document.getElementById("paymentSection").style.display = "none";
      liveAmountContainer.style.display = "none";
      cachedData = {};
    } else {
      // Show error from Google Script (e.g., "UTR already exists")
      showMessage(`⚠️ ${result.message}`, "error");
    }
  } catch (err) {
    console.error("Error submitting form: ", err);
    showMessage("⚠️ A network error occurred. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Confirm Registration';
  }
});

// Helper function to show messages
function showMessage(msg, type) {
  const box = document.getElementById("message");
  box.style.display = "block";
  box.className = "message " + type;
  box.innerHTML = msg; // Use innerHTML to render the link
}
