const video = document.querySelector('#result-video');
const mediaStatus = document.querySelector('#media-status');
const demoTitle = document.querySelector('#demo-title');
const sampleQuestion = document.querySelector('#sample-question');
const sampleAnswer = document.querySelector('#sample-answer');
const sampleFollowup = document.querySelector('#sample-followup');
const palletSetup = document.querySelector('#pallet-setup');
const palletResponse = document.querySelector('#pallet-no-response');
const palletFollowup = document.querySelector('#pallet-followup');
const chatPartChoice = document.querySelector('#chat-part-choice');
const chatPartSearch = document.querySelector('#chat-part-search');
const chatRun = document.querySelector('#chat-run');
const chatReview = document.querySelector('#chat-review');
const noParts = document.querySelector('#chat-no-parts');
const resultPlay = document.querySelector('#result-play');
const trialResults = document.querySelector('#trial-results');
const palletResultWait = document.querySelector('#pallet-result-wait');
let chatTimer;
let palletComplete = false;
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

function showPalletResults() {
  palletResultWait.hidden = true;
  video.hidden = false;
  resultPlay.hidden = false;
  trialResults.hidden = false;
  trialAssembly.hidden = false;
  document.querySelector('#palletizing-legend').hidden = false;
  showTrial(recommended);
}

noParts.addEventListener('click', () => {
  chatPartChoice.hidden = true;
  palletResponse.hidden = false;
  chatPartSearch.textContent = '부품 구성 파악 및 모델 선택 중';
  chatPartSearch.classList.add('chat-loading');
  palletResultWait.textContent = '부품 조합과 시뮬레이션 모델을 선택하는 중입니다.';
  palletResponse.querySelector('.from-user').focus({ preventScroll: true });
  chatTimer = setTimeout(() => {
    chatPartSearch.classList.remove('chat-loading');
    chatPartSearch.textContent = '모델 선택 완료: Isaac Sim, 로봇과 그리퍼 5개 조합';
    chatRun.hidden = false;
    chatRun.classList.add('chat-loading');
    palletResultWait.textContent = '저장된 시뮬레이션 실행 기록을 불러오는 중입니다.';
    chatTimer = setTimeout(() => {
      chatRun.classList.remove('chat-loading');
      chatRun.textContent = '시뮬레이션 실행 기록 확인 완료';
      chatReview.hidden = false;
      palletFollowup.hidden = false;
      palletComplete = true;
      showPalletResults();
      document.querySelector('#preview-pallet-answer').hidden = false;
      document.querySelector('#preview-pallet-result').hidden = false;
      document.querySelector('#preview-pallet-wait').hidden = true;
    }, 3000);
  }, 3000);
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
  trialResults.hidden = true;
  palletSetup.hidden = !palletizing;
  palletResponse.hidden = true;
  palletFollowup.hidden = true;
  document.querySelector('#incline-chat-answer').hidden = palletizing;
  trialAssembly.hidden = true;
  video.hidden = palletizing;
  resultPlay.hidden = palletizing;
  palletResultWait.hidden = !palletizing;
  mediaStatus.hidden = true;

  if (palletizing) {
    video.pause();
    demoTitle.textContent = '커피 상자 팔레트 적재 부품 비교';
    sampleQuestion.textContent = initialQuestion;
    sampleAnswer.textContent = successful.length
      ? recommended.arm + '에 PowerPick ' + recommended.tool + '를 조합한 구성이 이번 시험에서 가장 좋았어요. ' + recommended.assembly + ' 적재를 완료한 구성 중 여섯 관절의 이동량 합계가 ' + recommended.jointTravelDeg.toFixed(1) + '도로 가장 작았습니다.'
      : '다섯 구성 모두 이번 시험의 적재 기준을 충족하지 못했습니다.';
    sampleFollowup.textContent = '같은 2.5 kg 상자와 경로에서 미리 실행한 다섯 조합 중 ' + successful.length + '개가 적재를 마쳤습니다. 옆 표에서 결과와 촬영 영상을 비교할 수 있어요.';
    chatPartChoice.hidden = palletComplete;
    palletResponse.hidden = !palletComplete;
    palletFollowup.hidden = !palletComplete;
    document.querySelector('#palletizing-legend').hidden = true;
    if (palletComplete) {
      showPalletResults();
    } else {
      chatRun.hidden = true;
      chatReview.hidden = true;
      palletResultWait.textContent = '부품 추천을 요청하면 검증이 시작됩니다.';
    }
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
resultPlay.addEventListener('click', playVideo);
for (const id of ['preview-start-link', 'preview-trials-link']) {
  document.querySelector('#' + id).addEventListener('click', () => {
    if (document.querySelector('[data-demo="palletizing"]').getAttribute('aria-pressed') !== 'true') {
      showDemo('palletizing');
    }
  });
}
showDemo('palletizing');

function appendChatMessage(messages, sender, label, text) {
  const turn = document.createElement('div');
  const bubble = document.createElement('div');
  const name = document.createElement('p');
  const content = document.createElement('p');
  turn.className = 'chat-turn';
  bubble.className = sender;
  name.className = 'label';
  name.textContent = label;
  content.textContent = text;
  bubble.append(name, content);
  turn.append(bubble);
  messages.append(turn);
  return content;
}

document.querySelectorAll('form.chat-compose').forEach(form => {
  const input = form.elements.namedItem('message');
  const messages = form.previousElementSibling;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    appendChatMessage(messages, 'from-user', '나', question);
    const reply = appendChatMessage(messages, 'from-axon', 'Axon', '답변 준비 중');
    reply.classList.add('chat-loading');
    setTimeout(() => {
      reply.classList.remove('chat-loading');
      reply.textContent = '직접 입력한 질문을 시뮬레이션으로 실행하는 기능은 현재 준비 중입니다.';
    }, 500);
    form.reset();
    input.focus();
  });
});

const dockCase = document.querySelector('#dock-case');
const dockVideo = document.querySelector('#dock-video');
const dockDataStatus = document.querySelector('#dock-data-status');
const dockFields = ['time', 'gap', 'depth'].map(name => document.querySelector('#dock-' + name));
let dockReadings = [];
let dockRequest;

function updateDockReadings() {
  const row = dockReadings[Math.min(dockReadings.length - 1, Math.floor(dockVideo.currentTime * 12))];
  const values = row ? [row.time.toFixed(2) + ' s', row.gap.toFixed(2) + ' m', row.depth.toFixed(5)] : ['—', '—', '—'];
  dockFields.forEach((field, index) => { field.textContent = values[index]; });
}

async function loadDockCase() {
  dockRequest?.abort();
  const request = new AbortController();
  dockRequest = request;
  const path = 'media/dock-' + dockCase.value;
  dockVideo.pause();
  dockVideo.poster = path + '.jpg';
  dockVideo.src = path + '.mp4';
  dockDataStatus.hidden = true;
  dockReadings = [];
  updateDockReadings();
  try {
    const response = await fetch(path + '.json', { signal: request.signal });
    if (!response.ok) throw new Error('Sensor log unavailable');
    const readings = await response.json();
    if (request.signal.aborted) return;
    dockReadings = readings;
    updateDockReadings();
  } catch {
    if (request.signal.aborted) return;
    dockDataStatus.textContent = '센서 기록을 불러오지 못했습니다.';
    dockDataStatus.hidden = false;
  }
}

dockCase.addEventListener('change', loadDockCase);
dockVideo.addEventListener('timeupdate', updateDockReadings);
loadDockCase();

const logoTrack = document.querySelector('.simulator-track');
const logoCopy = logoTrack.firstElementChild.cloneNode(true);
logoCopy.setAttribute('aria-hidden', 'true');
logoTrack.append(logoCopy);
