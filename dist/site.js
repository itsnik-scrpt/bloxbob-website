const joinButton = document.querySelector('[data-copy-ip]');
const toast = document.querySelector('[data-toast]');

if (joinButton) {
  joinButton.addEventListener('click', async () => {
    const ip = joinButton.dataset.copyIp;
    try {
      await navigator.clipboard.writeText(ip);
    } catch {
      const fallback = document.createElement('textarea');
      fallback.value = ip;
      fallback.style.position = 'fixed';
      fallback.style.opacity = '0';
      document.body.appendChild(fallback);
      fallback.select();
      const copied = document.execCommand('copy');
      fallback.remove();
      if (!copied) {
        toast.textContent = `Copy this server IP: ${ip}`;
        toast.classList.add('visible');
        return;
      }
    }
    toast.textContent = `${ip} copied`;
    toast.classList.add('visible');
    joinButton.querySelector('[data-copy-label]').textContent = 'Copied!';
    window.setTimeout(() => {
      toast.classList.remove('visible');
      joinButton.querySelector('[data-copy-label]').textContent = 'Join';
    }, 2400);
  });
}
