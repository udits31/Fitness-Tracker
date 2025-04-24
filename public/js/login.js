document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('login-form');
  
  // Check form
  if (!form) {
    console.error('Login form not found');
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
    console.log('Login form submitted');

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    console.log('Form data:', data);

    // validation
    if (!data.email || !data.password) {
      msg.textContent = "Please fill in all fields.";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      msg.textContent = "Please enter a valid email address.";
      return;
    }

    try {
      console.log('Sending request to /api/auth/login');
      const res = await fetch('/api/auth/login', {
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
        window.location.href = '/home.html'; // Redirect on success
      } else {
        msg.textContent = result.message || 'Login failed.';
      }
    } catch (err) {
      console.error('Fetch error:', err);
      msg.textContent = 'Server error. Try again later.';
    }
  });
});