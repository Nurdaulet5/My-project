async function submitContactForm(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);

  const payload = {
    name: String(formData.get('name') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    service: String(formData.get('service') || '').trim(),
    message: String(formData.get('message') || '').trim(),
  };

  submitButton.disabled = true;
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Отправка...';

  try {
    const apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${apiBaseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Не удалось отправить заявку');
    }

    alert('Спасибо! Ваша заявка отправлена.');
    form.reset();
  } catch (error) {
    alert(error.message || 'Ошибка отправки формы');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;
  contactForm.addEventListener('submit', submitContactForm);
});
