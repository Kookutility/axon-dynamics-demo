const video = document.querySelector('#result-video');
const mediaStatus = document.querySelector('#media-status');
const demoTitle = document.querySelector('#demo-title');
const snapshot = document.querySelector('#result-snapshot');
const sampleQuestion = document.querySelector('#sample-question');
const sampleAnswer = document.querySelector('#sample-answer');
const sampleFollowup = document.querySelector('#sample-followup');
const palletSetup = document.querySelector('#pallet-setup');
const palletResponse = document.querySelector('#pallet-no-response');
const palletFollowup = document.querySelector('#pallet-followup');
const chatEnvironment = document.querySelector('#chat-environment');
const chatComposition = document.querySelector('#chat-composition');
const chatPartChoice = document.querySelector('#chat-part-choice');
const chatPartSearch = document.querySelector('#chat-part-search');
const noParts = document.querySelector('#chat-no-parts');
let chatTimer;
const trialName = document.querySelector('#trial-name');
const trialStatus = document.querySelector('#trial-status');
const trialAssembly = document.querySelector('#trial-assembly');
const demoButtons = document.querySelectorAll('[data-demo]');
const initialQuestion = sampleQuestion.textContent;
const parts = {
  'ur10e-0-large': { arm: 'UR10e', tool: '0 mm 플레이트 + 대형 브래킷', assembly: '손목 연장부에 0 mm 오프셋 플레이트를 장착하고 대형 흡착컵 브래킷을 조립했습니다.' },
  'ur10e-100-large': { arm: 'UR10e', tool: '100 mm 튜브 + 대형 브래킷', assembly: '손목 플랜지에 PowerPick 100 mm 오프셋 튜브를 장착하고 튜브에 대형 흡착컵 브래킷을 조립했습니다.' },
  'ur10e-200-large': { arm: 'UR10e', tool: '200 mm 튜브 + 대형 브래킷', assembly: '손목 플랜지에 PowerPick 200 mm 오프셋 튜브를 달고 대형 흡착컵 브래킷을 조립했습니다.' },
  'ur10e-200-small': { arm: 'UR10e', tool: '200 mm 튜브 + 소형 브래킷', assembly: '손목 플랜지에 PowerPick 200 mm 오프셋 튜브를 달고 소형 흡착컵 브래킷을 조립했습니다.' },
  'ur5e-0-large': { arm: 'UR5e', tool: '0 mm 플레이트 + 대형 브래킷', assembly: '손목 연장부에 PowerPick 0 mm 플레이트와 대형 흡착컵 브래킷을 조립했습니다.' }
};
const trials = palletResults.map(result => ({ ...result, ...parts[result.config] }));
const successful = trials.filter(trial => trial.placed).sort((a, b) => a.jointTravelDeg - b.jointTravelDeg);
const recommended = successful[0] ?? trials[0];

function showMedia(source, image, title) {
  video.pause();
  video.src = source;
  video.poster = image;
  video.setAttribute('aria-label', title + ' 영상');
  video.load();
  snapshot.href = image;
  mediaStatus.hidden = true;
}

async function playVideo() {
  mediaStatus.hidden = true;
  try {
    if (video.readyState) video.currentTime = 0;
    await video.play();
  } catch (error) {
    if (error.name === 'AbortError') return;
    mediaStatus.textContent = '영상을 불러오지 못했습니다.';
    mediaStatus.hidden = false;
  }
}

function placementLabel(trial) {
  if (trial.placed) return '완료';
  if (trial.positionErrorMm > 5 || trial.orientationErrorDeg > 2) return '경로 기준 초과';
  return '배치 기준 초과';
}

const trialRows = document.querySelector('#trial-rows');
for (const trial of trials) {
  const row = document.createElement('tr');
  row.dataset.trial = trial.config;
  const heading = document.createElement('th');
  heading.scope = 'row';
  const arm = document.createElement('strong');
  arm.textContent = trial.arm;
  const tool = document.createElement('span');
  tool.textContent = trial.tool + (trial === successful[0] ? ' (추천)' : '');
  heading.append(arm, tool);
  row.append(heading);
  const maxError = trial.positionErrorMm.toFixed(2) + ' mm / ' + trial.orientationErrorDeg.toFixed(2) + '°';
  for (const value of [placementLabel(trial), maxError, trial.jointTravelDeg.toFixed(1) + '°']) {
    const cell = document.createElement('td');
    cell.textContent = value;
    row.append(cell);
  }
  const cell = document.createElement('td');
  const watch = document.createElement('button');
  watch.type = 'button';
  watch.textContent = '영상';
  watch.setAttribute('aria-label', trial.arm + ' ' + trial.tool + ' 영상 재생');
  watch.addEventListener('click', () => {
    showTrial(trial);
    void playVideo();
    video.scrollIntoView({ block: 'nearest' });
  });
  cell.append(watch);
  row.append(cell);
  trialRows.append(row);
}

function showTrial(trial) {
  const prefix = 'media/pallet-' + trial.config;
  trialName.textContent = trial.arm + ' / PowerPick ' + trial.tool;
  const reason = trial.positionErrorMm > 5 || trial.orientationErrorDeg > 2 ? ' (집기 생략)' : '';
  trialStatus.textContent = placementLabel(trial) + reason;
  trialAssembly.textContent = trial.assembly;
  showMedia(prefix + '.mp4', prefix + '.jpg', trialName.textContent);
  for (const row of trialRows.children) {
    const active = row.dataset.trial === trial.config;
    row.classList.toggle('selected', active);
    row.querySelector('button').setAttribute('aria-pressed', String(active));
  }
}

function startPalletChat() {
  chatEnvironment.textContent = '시뮬레이션 환경 확정 중';
  chatComposition.hidden = true;
  chatPartChoice.hidden = true;
  palletResponse.hidden = true;
  palletFollowup.hidden = true;
  noParts.hidden = false;
  chatTimer = setTimeout(() => {
    chatEnvironment.textContent = '시뮬레이션 환경 확정 완료';
    chatComposition.hidden = false;
    chatTimer = setTimeout(() => {
      chatComposition.textContent = '사용할 부품 구성 검토 완료';
      chatPartChoice.hidden = false;
    }, 650);
  }, 550);
  chatComposition.textContent = '사용할 부품 구성 검토 중';
}

noParts.addEventListener('click', () => {
  noParts.hidden = true;
  palletResponse.hidden = false;
  chatPartSearch.textContent = '사용할 부품 구성 파악 중';
  chatPartSearch.classList.add('chat-loading');
  palletResponse.querySelector('.from-user').focus({ preventScroll: true });
  chatTimer = setTimeout(() => {
    chatPartSearch.textContent = '부품 조합 5개의 시뮬레이션 결과 비교 중';
    chatTimer = setTimeout(() => {
      chatPartSearch.textContent = '부품 조합 5개 비교 완료';
      chatPartSearch.classList.remove('chat-loading');
      palletFollowup.hidden = false;
    }, 1500);
  }, 1300);
});

function showDemo(selected) {
  clearTimeout(chatTimer);
  const palletizing = selected === 'palletizing';
  demoButtons.forEach(button => {
    const id = button.dataset.demo;
    button.setAttribute('aria-pressed', String(id === selected));
    document.querySelector('#' + id + '-legend').hidden = id !== selected;
    document.querySelector('#' + id + '-conditions').hidden = id !== selected;
  });
  document.querySelector('#trial-results').hidden = !palletizing;
  palletSetup.hidden = !palletizing;
  palletResponse.hidden = true;
  palletFollowup.hidden = true;
  document.querySelector('#incline-chat-answer').hidden = palletizing;
  trialAssembly.hidden = !palletizing;

  if (palletizing) {
    demoTitle.textContent = '커피 상자 팔레트 적재 부품 비교';
    sampleQuestion.textContent = initialQuestion;
    sampleAnswer.textContent = successful.length
      ? recommended.arm + '에 PowerPick ' + recommended.tool + '를 조합한 구성이 이번 시험에서 가장 좋았어요. ' + recommended.assembly + ' 적재를 완료한 구성 중 여섯 관절의 이동량 합계가 ' + recommended.jointTravelDeg.toFixed(1) + '도로 가장 작았습니다.'
      : '다섯 구성 모두 이번 시험의 적재 기준을 충족하지 못했습니다.';
    sampleFollowup.textContent = '같은 2.5 kg 상자와 경로에서 미리 실행한 다섯 조합 중 ' + successful.length + '개가 적재를 마쳤습니다. 옆 표에서 결과와 촬영 영상을 비교할 수 있어요.';
    showTrial(recommended);
    startPalletChat();
    return;
  }

  demoTitle.textContent = '경사 이송 구간의 정지 안정성 검증';
  sampleQuestion.textContent = '18도 경사에서 이송 설비가 멈추면 12 kg 상자가 제자리에 있나요?';
  document.querySelector('#incline-answer').textContent = '접촉면에 따라 달랐어요. 마찰계수 0.10에서는 상자가 경사면을 벗어났고, 0.65에서는 처음 위치에 머물렀습니다.';
  showMedia('media/isaac-pallet-incline.mp4?v=factory', 'media/isaac-frame-118.jpg?v=factory', demoTitle.textContent);
}

demoButtons.forEach(button => button.addEventListener('click', () => {
  if (button.getAttribute('aria-pressed') !== 'true') showDemo(button.dataset.demo);
}));
document.querySelector('#result-play').addEventListener('click', playVideo);
showDemo('palletizing');

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
