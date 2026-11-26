const video = document.querySelector('#result-video');
const mediaStatus = document.querySelector('#media-status');
const demoTitle = document.querySelector('#demo-title');
const snapshot = document.querySelector('#result-snapshot');
const sampleQuestion = document.querySelector('#sample-question');
const sampleAnswer = document.querySelector('#sample-answer');
const demoButtons = document.querySelectorAll('[data-demo]');
const demos = {
  incline: {
    title: demoTitle.textContent,
    video: video.getAttribute('src'),
    image: video.getAttribute('poster'),
    question: sampleQuestion.textContent,
    answer: sampleAnswer.textContent
  },
  palletizing: {
    title: 'Napco Brands의 커피 상자 팔레트 적재',
    video: 'media/isaac-napco-palletizing.mp4',
    image: 'media/isaac-palletizing-116.jpg',
    question: '밀봉이 끝난 커피 상자를 컨베이어에서 팔레트로 어떻게 옮기나요?',
    answer: 'UR10e가 PowerPick으로 상자 윗면을 잡고 팔레트 위까지 옮깁니다. 영상에서 상자를 내려놓고 그리퍼가 빠져나오는 동작을 볼 수 있어요.'
  }
};

demoButtons.forEach(button => button.addEventListener('click', () => {
  if (button.getAttribute('aria-pressed') === 'true') return;
  const selected = button.dataset.demo;
  const demo = demos[selected];
  video.pause();
  video.src = demo.video;
  video.poster = demo.image;
  video.setAttribute('aria-label', demo.title + ' 영상');
  video.load();
  demoTitle.textContent = demo.title;
  sampleQuestion.textContent = demo.question;
  sampleAnswer.textContent = demo.answer;
  snapshot.href = demo.image;
  mediaStatus.hidden = true;
  demoButtons.forEach(option => {
    const id = option.dataset.demo;
    option.setAttribute('aria-pressed', String(id === selected));
    document.querySelector('#' + id + '-legend').hidden = id !== selected;
    document.querySelector('#' + id + '-conditions').hidden = id !== selected;
  });
}));

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
