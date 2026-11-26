const video = document.querySelector('#result-video');
const mediaStatus = document.querySelector('#media-status');

document.querySelector('#result-play').addEventListener('click', async () => {
  mediaStatus.hidden = true;
  try {
    if (video.readyState) video.currentTime = 0;
    await video.play();
  } catch {
    mediaStatus.textContent = '영상을 불러오지 못했습니다.';
    mediaStatus.hidden = false;
  }
});

const logoTrack = document.querySelector('.simulator-track');
const logoCopy = logoTrack.firstElementChild.cloneNode(true);
logoCopy.setAttribute('aria-hidden', 'true');
logoTrack.append(logoCopy);

const motionButton = document.querySelector('#simulator-motion');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let logosPlaying = !reducedMotion.matches;

function updateLogoMotion() {
  logoTrack.parentElement.classList.toggle('motion-enabled', logosPlaying);
  logoTrack.classList.toggle('is-paused', !logosPlaying);
  motionButton.textContent = logosPlaying ? '로고 정지' : '로고 재생';
}

motionButton.addEventListener('click', () => {
  logosPlaying = !logosPlaying;
  updateLogoMotion();
});
reducedMotion.addEventListener('change', event => {
  logosPlaying = !event.matches;
  updateLogoMotion();
});
updateLogoMotion();
