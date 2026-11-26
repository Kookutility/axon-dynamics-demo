const prompt = '18° 경사 이송 구간에서 정지한 12 kg 포장품의 위치를 유지하려면 어떤 표면이 적합한가요?';
const workflow = [
  '이송 구간 정지 시 포장품이 초기 위치를 유지하는지 비교합니다.',
  '물류 이송 공정의 경사 컨베이어 구간입니다.',
  'NVIDIA Isaac Sim에서 PhysX 강체 접촉과 마찰 모델을 사용했습니다.',
  '18° 경사에 12 kg 포장품을 놓고 마찰계수 0.10과 0.65를 비교했습니다.'
];

const log = document.querySelector('#chat-log');
const form = document.querySelector('#chat-form');
const input = document.querySelector('#chat-input');
const example = document.querySelector('[data-scenario]');
const pipeline = document.querySelector('#pipeline');
const result = document.querySelector('#demo-result');
const video = document.querySelector('#result-video');
const mediaStatus = document.querySelector('#media-status');
const steps = [...pipeline.querySelectorAll('li')];
const runStatus = document.querySelector('#run-status');

function appendMessage(speaker, content) {
  const turn = document.createElement('div');
  turn.className = 'chat-turn';
  const message = document.createElement('div');
  message.className = speaker === '나' ? 'from-user' : 'from-axon';
  const label = document.createElement('p');
  label.className = 'label';
  label.textContent = speaker;
  const body = document.createElement('p');
  body.textContent = content;
  message.append(label, body);
  turn.append(message);
  log.append(turn);
  log.scrollTop = log.scrollHeight;
}

function submit(question) {
  appendMessage('나', question);
  video.pause();
  const matched = /경사|이송|정지|미끄러|마찰|컨베이어|incline|friction|conveyor|slid/i.test(question);
  example.setAttribute('aria-pressed', String(matched));
  pipeline.hidden = !matched;
  result.hidden = !matched;
  if (!matched) {
    runStatus.textContent = '일치하는 촬영 사례 없음';
    appendMessage('액슨', '현재는 경사 컨베이어 사례를 볼 수 있어요. 이송이 멈췄을 때 포장품이 위치를 유지하는지 질문해 보세요.');
    return;
  }
  steps.forEach((step, index) => {
    step.querySelector('span').textContent = workflow[index];
  });
  if (video.readyState) video.currentTime = 0;
  runStatus.textContent = '촬영 결과 준비 완료';
  appendMessage('액슨', '두 표면을 같은 하중과 경사에서 비교했습니다. 영상에서 포장품이 초기 위치를 유지하는지 확인할 수 있습니다.');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const question = input.value.trim();
  if (!question) return;
  form.reset();
  submit(question);
  input.focus();
});

example.addEventListener('click', () => submit(prompt));
document.querySelector('#result-play').addEventListener('click', async () => {
  try {
    video.currentTime = 0;
    await video.play();
  } catch {
    mediaStatus.textContent = '영상을 불러오지 못했습니다.';
  }
});

appendMessage('액슨', '경사 이송 구간의 정지 안정성을 검증한 사례입니다. 검증 조건과 촬영 결과를 확인할 수 있습니다.');

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




