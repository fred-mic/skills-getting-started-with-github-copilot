document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
  // Always request fresh activity data (avoid cached responses)
  const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep the placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section (list with delete buttons)
        let participantsSection = '';
        if (details.participants && details.participants.length) {
          participantsSection = `<ul class="participants-list">${details.participants
            .map(
              (p) =>
                `<li>
                  <span class="participant-email">${p}</span>
                  <button class="participant-remove" data-activity="${encodeURIComponent(
                    name
                  )}" data-email="${encodeURIComponent(p)}" aria-label="Remove ${p}">✕</button>
                </li>`
            )
            .join("")}</ul>`;
        } else {
          participantsSection = `<p class="no-participants">No participants yet</p>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <h5>Participants</h5>
            ${participantsSection}
          </div>
        `;

        // Attach remove handlers for this card
        // (delegation after appending to DOM)

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
        // After appending, wire up the remove buttons inside this card
        const removeButtons = activityCard.querySelectorAll('.participant-remove');
        removeButtons.forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const activityEncoded = btn.getAttribute('data-activity');
            const emailEncoded = btn.getAttribute('data-email');
            const activityName = decodeURIComponent(activityEncoded);
            const email = decodeURIComponent(emailEncoded);

            // Confirm removal
            if (!confirm(`Remove ${email} from ${activityName}?`)) return;

            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(
                  email
                )}`,
                { method: 'DELETE' }
              );

              const data = await res.json();
              if (res.ok) {
                // show a brief success message
                messageDiv.textContent = data.message;
                messageDiv.className = 'message success';
                messageDiv.classList.remove('hidden');
                // Refresh list and wait for it to finish so UI updates immediately
                await fetchActivities();
              } else {
                messageDiv.textContent = data.detail || 'Failed to remove participant';
                messageDiv.className = 'message error';
                messageDiv.classList.remove('hidden');
              }

              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            } catch (err) {
              messageDiv.textContent = 'Failed to remove participant. Please try again.';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
              console.error('Error removing participant:', err);
            }
          });
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        // keep the base 'message' class for consistent styling
        messageDiv.className = 'message success';
        signupForm.reset();

        // Refresh the activities list so availability and participants update
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = 'message error';
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
