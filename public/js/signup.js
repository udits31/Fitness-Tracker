document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('signup-form');
  
  // Check form
  if (!form) {
    console.error('Signup form not found');
    return;
  }
  
  let msg = document.getElementById('message');
  if (!msg) {
    msg = document.createElement('div');
    msg.id = 'message';
    msg.className = 'error-message';
    form.prepend(msg);
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Form submitted');

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    console.log('Form data:', data);

    // validation
    if (!data.name || !data.email || !data.password || !data.weight || !data.height || !data.dob || !data.gender) {
      msg.textContent = "Please fill in all fields.";
      return;
    }

    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(data.gender)) {
      msg.textContent = "Please select a valid gender option.";
      return;
    }

    if (data.password.length < 6) {
      msg.textContent = "Password must be at least 6 characters.";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      msg.textContent = "Please enter a valid email address.";
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`Server responded with ${res.status}`);
      }
      
      const result = await res.json();
      console.log('Response data:', result);

      if (result.success) {
        msg.textContent = 'Signup successful! Redirecting to login...';
        msg.className = 'success-message';
        
        setTimeout(() => {
          window.location.href = '/login.html'; // on success
        }, 1500);
      } else {
        msg.textContent = result.message || 'Signup failed.';
      }
    } catch (err) {
      console.error('Fetch error:', err);
      msg.textContent = 'Server error. Try again later.';
    }
  });
});