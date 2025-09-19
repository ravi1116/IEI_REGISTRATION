form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const events = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
  const amount = calculateAmount();

  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbzvMOJiY6qRQBNCpaoPqaU5HNUR-wgrPrTuPdbeOlToymtc-R9HvtYh_2ICaSAMRfKK/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, events, amount })
    });

    const result = await response.json();
    if (result.success) {
      confirmation.textContent = "✅ Registration successful! Data saved to Google Sheets.";
      confirmation.style.color = "green";
    } else {
      confirmation.textContent = "❌ Error saving data.";
      confirmation.style.color = "red";
    }
  } catch (err) {
    confirmation.textContent = "❌ Failed to connect to Google Sheets.";
    confirmation.style.color = "red";
  }
});
