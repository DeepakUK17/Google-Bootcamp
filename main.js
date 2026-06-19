import './style.css';

const input = document.getElementById('username');
const btn = document.getElementById('roast-btn');
const loading = document.getElementById('loading');
const resultCard = document.getElementById('result-card');
const errorMsg = document.getElementById('error-msg');
const copyBtn = document.getElementById('copy-btn');
const spiceLevelSelect = document.getElementById('spice-level');

// DOM Elements to update
const avatar = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const handle = document.getElementById('handle');
const accountAgeEl = document.getElementById('account-age');
const reposEl = document.getElementById('repos');
const starsEl = document.getElementById('stars');
const followersEl = document.getElementById('followers');
const followingEl = document.getElementById('following');
const roastText = document.getElementById('roast-text');

let langChartInstance = null;
let currentRoastText = "";

// Theme switching
spiceLevelSelect.addEventListener('change', (e) => {
  document.body.className = '';
  if (e.target.value !== 'medium') {
    document.body.classList.add(`theme-${e.target.value}`);
  }
});

btn.addEventListener('click', () => {
  const username = input.value.trim();
  if (username) fetchProfile(username);
});

input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const username = input.value.trim();
    if (username) fetchProfile(username);
  }
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(currentRoastText);
  copyBtn.textContent = "✅ Copied!";
  setTimeout(() => copyBtn.textContent = "📋 Copy", 2000);
});

async function fetchProfile(username) {
  resultCard.classList.add('hidden');
  errorMsg.classList.add('hidden');
  loading.classList.remove('hidden');

  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    if (!response.ok) throw new Error('User not found');
    const user = await response.json();
    
    // Fetch all pages of repos if possible, but for speed just get 100
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
    const repos = reposResponse.ok ? await reposResponse.json() : [];

    processAnalytics(user, repos);

  } catch (error) {
    loading.classList.add('hidden');
    errorMsg.classList.remove('hidden');
  }
}

function processAnalytics(user, repos) {
  // Basic Info
  avatar.src = user.avatar_url;
  nameEl.textContent = user.name || user.login;
  handle.textContent = `@${user.login}`;
  handle.href = user.html_url;
  
  const createdDate = new Date(user.created_at);
  const yearsActive = new Date().getFullYear() - createdDate.getFullYear();
  accountAgeEl.textContent = `Joined: ${createdDate.toLocaleDateString()} (${yearsActive} yrs ago)`;

  reposEl.textContent = user.public_repos;
  followersEl.textContent = user.followers;
  followingEl.textContent = user.following;

  // Aggregate repo data
  let totalStars = 0;
  let forkCount = 0;
  const langs = {};

  repos.forEach(repo => {
    totalStars += repo.stargazers_count;
    if (repo.fork) forkCount++;
    if (repo.language && !repo.fork) { // only count original work for language pie
      langs[repo.language] = (langs[repo.language] || 0) + 1;
    }
  });

  starsEl.textContent = totalStars;

  drawChart(langs);
  generateRoast(user, repos, totalStars, forkCount, langs, yearsActive);

  loading.classList.add('hidden');
  resultCard.classList.remove('hidden');
}

function drawChart(langs) {
  const ctx = document.getElementById('langChart').getContext('2d');
  
  if (langChartInstance) {
    langChartInstance.destroy();
  }

  const labels = Object.keys(langs);
  const data = Object.values(langs);

  if (labels.length === 0) {
    // Dummy data if no languages
    labels.push("Nothing");
    data.push(1);
  }

  // Generate some aesthetic colors
  const colors = labels.map((_, i) => `hsl(${(i * 360) / labels.length}, 70%, 60%)`);

  langChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#f8fafc' }
        }
      }
    }
  });
}

function generateRoast(user, repos, totalStars, forkCount, langs, yearsActive) {
  const spice = spiceLevelSelect.value;
  let roast = "";

  const topLang = Object.keys(langs).sort((a,b) => langs[b] - langs[a])[0];

  if (spice === 'mild') {
    roast = `You've been here for ${yearsActive} years and built a nice collection of ${user.public_repos} repos. `;
    if (totalStars > 0) roast += `Earning ${totalStars} stars is great work! `;
    else roast += `Don't worry about having 0 stars, building things for yourself is what matters. `;
    if (topLang) roast += `You clearly have a fondness for ${topLang}, keep it up!`;
  } 
  else if (spice === 'medium') {
    if (user.followers === 0) roast += "Zero followers? Your code is so secret even your friends don't want to see it. ";
    else roast += `Wow, ${user.followers} followers. Mom and dad must be proud. `;
    
    if (totalStars === 0) roast += "Not a single star. Maybe try starring your own repos so it doesn't look so empty. ";
    
    if (forkCount > repos.length / 2 && repos.length > 0) {
      roast += "More than half your repos are forks. Do you ever write original code? ";
    }
    
    if (topLang === 'PHP') roast += "Your top language is PHP. I'm so sorry. ";
    else if (topLang === 'JavaScript') roast += "JavaScript everywhere. Your `node_modules` folder is heavier than a black hole. ";
    else if (topLang === 'Python') roast += "Python developer. I bet you still can't center a div. ";
    else if (topLang === 'HTML') roast += "HTML is your most used language? You know that's not programming, right? ";
  } 
  else if (spice === 'nuclear') {
    roast = `Listen here ${user.name || user.login}. You've wasted ${yearsActive} years on GitHub to produce ${user.public_repos} pathetic repos. `;
    if (totalStars < 10) roast += `You have ${totalStars} stars total. I've seen typo-fixes get more stars than your entire career. `;
    if (user.following > user.followers * 5) roast += `You follow ${user.following} people like a puppy and only ${user.followers} pity-followed you back. `;
    if (!topLang) roast += `You literally have no original code. You are just wasting Microsoft's server space. `;
    else roast += `You use ${topLang} because you lack the brain capacity to learn anything harder. Just delete your account.`;
  }

  currentRoastText = roast;
  roastText.textContent = roast;
}
