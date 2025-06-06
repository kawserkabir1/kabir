
        // Apply custom classes with JS for Tailwind JIT
        tailwind.config = {
            theme: {
              extend: {
                // Custom styles can be added here if needed
              }
            },
            plugins: [
              function({ addUtilities }) {
                const newUtilities = {
                  '.trending-search-btn': {
                    '@apply inline-block bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full hover:bg-slate-600/70 hover:text-white transition-colors mx-1': {},
                  },
                  '.feature-card': {
                    '@apply p-8 bg-slate-800/50 border border-slate-700 rounded-2xl transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10': {},
                  },
                   '.feature-icon': {
                    '@apply inline-flex items-center justify-center h-12 w-12 rounded-lg bg-blue-500 text-white': {},
                  },
                  '.how-to-use-card': {
                    '@apply relative z-10': {},
                  },
                  '.how-to-use-visual': {
                    '@apply flex items-center justify-center h-24 w-24 mx-auto bg-slate-800/50 border-2 border-blue-500 rounded-full shadow-lg shadow-blue-500/20': {},
                  },
                  '.testimonial-card': {
                    '@apply p-8 bg-slate-800/50 border border-slate-700 rounded-2xl': {},
                  },
                  '.gemini-btn': {
                      '@apply bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors text-sm font-semibold whitespace-nowrap': {}
                  },
                  '.language-option': {
                      '@apply block px-4 py-2 text-sm text-slate-200 hover:bg-slate-600': {}
                  }
                }
  
                addUtilities(newUtilities, ['responsive', 'hover'])
              }
            ]
          }
      
          const searchInput = document.getElementById('searchInput');
          const suggestionsContainer = document.getElementById('suggestions');
          const searchSpinner = document.getElementById('searchSpinner');
          
          const lyricsModal = document.getElementById('lyricsModal');
          const lyricsContent = document.getElementById('lyricsContent');
          const closeModalButton = document.getElementById('closeModalButton');
          const backToTopBtn = document.getElementById('backToTopBtn');
          
          const geminiControls = document.getElementById('gemini-controls');
          const geminiOutput = document.getElementById('gemini-output');
          const summarizeBtn = document.getElementById('summarizeBtn');
          const artistBioBtn = document.getElementById('artistBioBtn');
          const songFactsBtn = document.getElementById('songFactsBtn');
          const analyzeMoodBtn = document.getElementById('analyzeMoodBtn');
          const generateChordsBtn = document.getElementById('generateChordsBtn');
          const similarSongsBtn = document.getElementById('similarSongsBtn');
          const translateBtn = document.getElementById('translateBtn');
          const languageDropdown = document.getElementById('language-dropdown');
  
          const API_URL = 'https://api.lyrics.ovh';
          let debounceTimer;
          let originalLyrics = '';
          let currentArtist = '';
          let currentTitle = '';
          
          const debounce = (func, delay) => {
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(func, delay);
          };
          
          const performSearch = (query) => {
              searchInput.value = query;
              if (query.trim()) {
                  searchSpinner.classList.remove('hidden');
                  debounce(() => searchSongs(query.trim()), 300);
              } else {
                  searchSpinner.classList.add('hidden');
                  suggestionsContainer.innerHTML = '';
              }
          };
  
          searchInput.addEventListener('input', () => {
              const query = searchInput.value;
              // The trim() is removed from here to allow spaces during typing
              if (query) {
                  searchSpinner.classList.remove('hidden');
                  debounce(() => searchSongs(query.trim()), 300);
              } else {
                  searchSpinner.classList.add('hidden');
                  suggestionsContainer.innerHTML = '';
              }
          });
          
          document.querySelectorAll('.trending-search-btn').forEach(button => {
              button.addEventListener('click', () => {
                  performSearch(button.textContent);
              });
          });
          
          closeModalButton.addEventListener('click', () => {
              lyricsModal.classList.add('hidden');
              document.body.classList.remove('body-no-scroll');
          });
  
          async function searchSongs(query) {
              try {
                  const response = await fetch(`${API_URL}/suggest/${query}`);
                  if (!response.ok) throw new Error('Suggestions not found.');
                  const data = await response.json();
                  displaySuggestions(data.data);
              } catch (error) {
                  console.error("Suggestion Error:", error);
                  displayError(suggestionsContainer, "Could not fetch suggestions.");
              } finally {
                  searchSpinner.classList.add('hidden');
              }
          }
  
          function displaySuggestions(songs) {
              if (songs.length === 0) {
                  displayError(suggestionsContainer, "No songs found for your search.");
                  return;
              }
              suggestionsContainer.innerHTML = songs.slice(0, 5).map(song => `
                  <div class="flex items-center p-3 bg-slate-800/50 border border-slate-700/80 rounded-xl hover:bg-slate-700/70 cursor-pointer transition-all duration-200" 
                       onclick="getLyrics('${song.artist.name.replace(/'/g, "\\'")}', '${song.title.replace(/'/g, "\\'")}', '${song.album.cover_big}')">
                      <img src="${song.album.cover_medium}" alt="Album Art" class="w-16 h-16 rounded-lg object-cover flex-shrink-0" onerror="this.onerror=null;this.src='https://placehold.co/64x64/1f2937/ffffff?text=??';">
                      <div class="ml-4 overflow-hidden"><p class="font-bold text-lg text-slate-100 truncate">${song.title}</p><p class="text-sm text-slate-400 truncate">${song.artist.name}</p></div>
                  </div>`).join('');
          }
  
          async function getLyrics(artist, title, coverArt) {
              lyricsModal.classList.add('flex');
              lyricsModal.classList.remove('hidden');
              document.body.classList.add('body-no-scroll');
  
              currentArtist = artist;
              currentTitle = title;
              
              geminiOutput.classList.add('hidden');
              geminiOutput.innerHTML = '';
              
              lyricsContent.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center text-slate-500"><div class="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-blue-500"></div><p class="mt-4 text-lg">Fetching lyrics for "${title}"...</p></div>`;
              geminiControls.classList.add('hidden');
              
              try {
                  const response = await fetch(`${API_URL}/v1/${artist}/${title}`);
                  if (!response.ok) throw new Error('Lyrics not available for this song.');
                  const data = await response.json();
                  originalLyrics = data.lyrics;
                  displayLyrics(data.lyrics, title, artist, coverArt);
                  geminiControls.classList.remove('hidden');
              } catch (error) {
                  console.error("Lyrics Error:", error);
                  const errorMessage = `Sorry, lyrics for "${title}" by ${artist} are not available at the moment.`;
                  displayError(lyricsContent, errorMessage, true);
              }
          }
  
          function displayLyrics(lyrics, title, artist, coverArt) {
              const formattedLyrics = lyrics.replace(/(\r\n|\n|\r)/g, '<br>');
              lyricsContent.innerHTML = `
                  <div class="flex flex-col sm:flex-row items-center mb-8">
                      <img src="${coverArt}" alt="Album Art" class="w-28 h-28 rounded-lg object-cover shadow-2xl shadow-blue-500/10 flex-shrink-0" onerror="this.onerror=null;this.src='https://placehold.co/112x112/1e293b/ffffff?text=${title[0]}';">
                      <div class="sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left"><h2 class="text-3xl font-bold text-white">${title}</h2><p class="text-xl text-slate-300">${artist}</p></div>
                  </div>
                  <div class="lyrics-text text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">${formattedLyrics}</div>`;
              lyricsContent.scrollTop = 0;
          }
  
          function displayError(container, message, isLyricsError = false) {
               if (isLyricsError) {
                  container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center text-red-400"><svg class="w-16 h-16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg><p class="mt-4 text-lg">${message}</p></div>`;
               } else {
                   container.innerHTML = `<div class="p-4 text-center text-slate-400">${message}</div>`;
               }
          }
  
          // Gemini API Functions
          async function callGemini(prompt) {
              const apiKey = "AIzaSyCN-Pj28hWSCTBw9w0UiWMysWxT6T4wJ4M"; 
              const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
              
              const payload = {
                  contents: [{
                      parts: [{ text: prompt }]
                  }]
              };
  
              try {
                  const response = await fetch(apiUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                  });
  
                  if (!response.ok) {
                      throw new Error(`API Error: ${response.statusText}`);
                  }
  
                  const result = await response.json();
  
                  if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts) {
                      return result.candidates[0].content.parts[0].text;
                  } else {
                       console.error("Unexpected API response structure:", result);
                      throw new Error("No content received from Gemini or unexpected format.");
                  }
              } catch (error) {
                  console.error("Gemini API call failed:", error);
                  return `Error: Could not process the request. ${error.message}`;
              }
          }
          
          summarizeBtn.addEventListener('click', async () => {
              geminiOutput.classList.remove('hidden');
              geminiOutput.innerHTML = '<div class="flex items-center justify-center gap-2"><div class="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div><p>✨ Summarizing...</p></div>';
  
              const prompt = `Summarize the meaning of these song lyrics in a few sentences. What is the story or main emotion being conveyed? \n\nLyrics:\n${originalLyrics}`;
              const summary = await callGemini(prompt);
              geminiOutput.innerHTML = `<strong>Summary:</strong><br>${summary.replace(/\n/g, '<br>')}`;
          });
  
          artistBioBtn.addEventListener('click', async () => {
              geminiOutput.classList.remove('hidden');
              geminiOutput.innerHTML = '<div class="flex items-center justify-center gap-2"><div class="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div><p>✨ Getting artist bio...</p></div>';
  
              const prompt = `Provide a short biography (around 50-70 words) for the artist: ${currentArtist}.`;
              const bio = await callGemini(prompt);
              geminiOutput.innerHTML = `<strong>About ${currentArtist}:</strong><br>${bio.replace(/\n/g, '<br>')}`;
          });
  
          songFactsBtn.addEventListener('click', async () => {
              geminiOutput.classList.remove('hidden');
              geminiOutput.innerHTML = '<div class="flex items-center justify-center gap-2"><div class="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div><p>✨ Finding song facts...</p></div>';
  
              const prompt = `Provide 2-3 interesting and brief facts or trivia about the song "${currentTitle}" by ${currentArtist}. Format them as a simple list.`;
              const facts = await callGemini(prompt);
              geminiOutput.innerHTML = `<strong>Song Facts:</strong><br>${facts.replace(/\n/g, '<br>')}`;
          });
          
          analyzeMoodBtn.addEventListener('click', async () => {
              geminiOutput.classList.remove('hidden');
              geminiOutput.innerHTML = '<div class="flex items-center justify-center gap-2"><div class="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div><p>✨ Analyzing mood...</p></div>';
  
              const prompt = `Analyze the mood of the following lyrics. Respond with just one word for the mood and a single, relevant emoji, separated by a comma. For example: "Happy,😊" or "Sad,😢". \n\nLyrics:\n${originalLyrics}`;
              const moodResponse = await callGemini(prompt);
              const [mood, emoji] = moodResponse.split(',');
              geminiOutput.innerHTML = `<div class="text-center"><p class="text-5xl">${emoji || '❓'}</p><p class="mt-2 font-semibold">${mood || 'Could not determine mood'}</p></div>`;
          });
  
          generateChordsBtn.addEventListener('click', async () => {
              geminiOutput.classList.add('hidden');
              const lyricsTextElement = document.querySelector('.lyrics-text');
              lyricsTextElement.innerHTML = '<div class="flex items-center justify-center gap-2"><div class="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div><p>🎸 Generating Chords...</p></div>';
  
              const prompt = `Add simplified, beginner-friendly guitar chords to the following lyrics. Place the chord name in brackets like [C] or [G] right before the word where the chord change should happen. \n\nLyrics:\n${originalLyrics}`;
              let chords = await callGemini(prompt);
              // Bolding the chords
              chords = chords.replace(/\[(.*?)\]/g, '<strong class="text-sky-400">[$1]</strong>');
              lyricsTextElement.innerHTML = chords.replace(/(\r\n|\n|\r)/g, '<br>');
          });
  
          similarSongsBtn.addEventListener('click', async () => {
              geminiOutput.classList.remove('hidden');
              geminiOutput.innerHTML = '<div class="flex items-center justify-center gap-2"><div class="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div><p>🎧 Finding similar songs...</p></div>';
  
              const prompt = `Based on the song "${currentTitle}" by ${currentArtist}, suggest 3 other songs that are similar in mood, style, or lyrical theme. Please list them clearly as "Song Title - Artist Name".`;
              const similar = await callGemini(prompt);
              geminiOutput.innerHTML = `<strong>Similar Songs:</strong><br>${similar.replace(/\n/g, '<br>')}`;
          });
  
  
          translateBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              languageDropdown.classList.toggle('hidden');
          });
          
          document.addEventListener('click', (e) => {
               if (!translateBtn.contains(e.target) && !languageDropdown.contains(e.target)) {
                  languageDropdown.classList.add('hidden');
              }
          })
  
          document.querySelectorAll('.language-option').forEach(option => {
              option.addEventListener('click', async (e) => {
                  e.preventDefault();
                  const lang = e.target.dataset.lang;
                  languageDropdown.classList.add('hidden');
  
                  if (lang === 'Original') {
                      document.querySelector('.lyrics-text').innerHTML = originalLyrics.replace(/(\r\n|\n|\r)/g, '<br>');
                      return;
                  }
                  
                  const lyricsTextElement = document.querySelector('.lyrics-text');
                  lyricsTextElement.innerHTML = '<div class="flex items-center justify-center gap-2"><div class="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div><p>🈯 Translating...</p></div>';
  
                  const prompt = `Translate the following song lyrics to ${lang}. Keep the original line breaks and song structure.\n\nLyrics:\n${originalLyrics}`;
                  const translation = await callGemini(prompt);
                  lyricsTextElement.innerHTML = translation.replace(/(\r\n|\n|\r)/g, '<br>');
              });
          });
  
  
          // --- Website Functionality ---
          document.addEventListener('DOMContentLoaded', () => {
              // Set dynamic year in footer
              document.getElementById('copyright-year').textContent = new Date().getFullYear();
              
              const menuButton = document.getElementById('mobile-menu-button');
              const mobileMenu = document.getElementById('mobile-menu');
              const openIcon = document.getElementById('menu-open-icon');
              const closeIcon = document.getElementById('menu-close-icon');
  
              menuButton.addEventListener('click', () => {
                  mobileMenu.classList.toggle('hidden');
                  openIcon.classList.toggle('hidden');
                  closeIcon.classList.toggle('hidden');
              });
              
              mobileMenu.addEventListener('click', (e) => {
                  if (e.target.tagName === 'A') {
                       mobileMenu.classList.add('hidden');
                       openIcon.classList.remove('hidden');
                       closeIcon.classList.add('hidden');
                  }
              });
  
              const sections = document.querySelectorAll('.content-section');
              const observer = new IntersectionObserver((entries) => {
                  entries.forEach(entry => {
                      if (entry.isIntersecting) {
                          entry.target.classList.add('visible');
                      }
                  });
              }, { threshold: 0.1 });
  
              sections.forEach(section => {
                  observer.observe(section);
              });
              
              // Back to top button logic
              window.addEventListener('scroll', () => {
                  if (window.pageYOffset > 300) {
                      backToTopBtn.classList.remove('hidden');
                  } else {
                      backToTopBtn.classList.add('hidden');
                  }
              });
              backToTopBtn.addEventListener('click', () => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
              });
              
              // Function to draw the SVG connector
              // function drawConnector() {
              //     const step1 = document.getElementById('step-1');
              //     const step2 = document.getElementById('step-2');
              //     const step3 = document.getElementById('step-3');
              //     const svg = document.getElementById('connector-svg');
              //     const path = document.getElementById('connector-path');
                  
              //     if(!step1 || !step2 || !step3 || !path) return;
  
              //     const startX = step1.offsetLeft + step1.offsetWidth / 2;
                  
              //     const midX = step2.offsetLeft + step2.offsetWidth / 2;
                  
              //     const endX = step3.offsetLeft + step3.offsetWidth / 2;
  
              //     const d = `M ${startX - svg.getBoundingClientRect().left}, 48 
              //                C ${startX - svg.getBoundingClientRect().left + 100}, 48, ${midX - svg.getBoundingClientRect().left - 100}, 112, ${midX - svg.getBoundingClientRect().left}, 112
              //                S ${endX - svg.getBoundingClientRect().left - 100}, 176, ${endX - svg.getBoundingClientRect().left}, 176`;
                  
              //     path.setAttribute('d', d);
              // }
  
              // if(window.innerWidth >= 1024){
              //      drawConnector();
              //      window.addEventListener('resize', drawConnector);
              // }
          });
      
