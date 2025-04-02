const searchInput = document.getElementById('search-input')
const searchBtn = document.getElementById('search-btn')
const pokebox = document.getElementById('pokebox')
const pokeBall = document.getElementById('pokeball-box')
const notFound = document.getElementById('notfound')
const scrollButton = document.querySelector('#scroll-button')
const advancedResearch = document.getElementById('advanced-research')
const overlay = document.getElementById('overlay')
const sidebar = document.getElementById('sidebar')
const ulType = document.getElementById('type-list')
const liType = document.querySelectorAll('#type-list li')
const ShuffleBtn = document.getElementById('surprise-me')

//chiamata di tutti i tipi in automatico per precaricarli nella sidebar
callImgTypes()

searchBtn.addEventListener('click', (e) => {
    search()
})
searchInput.addEventListener('keydown', (e) =>{
    if (e.key === 'Enter') search()
})

searchInput.addEventListener('input', (e) =>{
    if (searchInput.value === ''.trim()) clearResearch()
})

window.addEventListener('scroll', (e) => {
    if (window.scrollY > 150) {
        scrollButton.classList.add('scrolled')
        scrollButton.addEventListener('click', (e) => {scrollToBegin()})
    } else{
        scrollButton.classList.remove('scrolled')
    }
})

ShuffleBtn.addEventListener('click',(e) => {
    shufflePokedex()
})

//event listener della sidebar

advancedResearch.addEventListener('click', (e) => {
    sidebar.classList.toggle('open')
    overlay.classList.toggle('shown')
})

overlay.addEventListener('click', (e) => {
    sidebar.classList.toggle('open')
    overlay.classList.toggle('shown')
    clearResearch()
})

sidebar.addEventListener('click', async (e) => {
    fetchSideBar(e)
});


//funzione per cercare per cercare
async function search (InputValue = searchInput.value) {
    let pokeLen = 0
    try{
        pokebox.innerHTML = ''
        notFound.classList.remove('visible')
        pokebox.style.display = 'flex'

        const linkApiNames = `https://pokeapi.co/api/v2/pokemon/${InputValue}`
        const linkApiTypes = `https://pokeapi.co/api/v2/type/${InputValue}`
        ShowSpinner()
        const response = await fetch(linkApiNames)
        // se non trova corrispondeza col nome (es. "l'utente scrive 'normal'") fa un altro fetch con il link "type"
        if (response.status === 404) {
            const responseTypes = await fetch (linkApiTypes)
            //l'if va subito dopo il fetch altrimneti viene chiamato il 404 senza controllo (quindi nel catch)

            if (responseTypes.status === 404) {
                //per cercare solo con l'id
                const responseID = await fetch(linkApiNames)

                if (responseTypes.status === 404) {
                    //per cercare solo il numero che viene cercato inserendo per esempio 'generazione 2'
                    const generationNumber = InputValue.split(' ')
                    const linkApiGeneration = `https://pokeapi.co/api/v2/generation/${generationNumber[1]}`
                    const responseGeneration = await fetch(linkApiGeneration)
                    const dataGeneration = await responseGeneration.json()
                    pokeLen = await renderGenerationPokemon(dataGeneration)
                }

                const dataID = await responseID.json()
                await renderPoke(dataID)
            }
            

            const dataTypes = await responseTypes.json()
            pokeLen = await renderTypesPokemon(dataTypes)
            
        }
        const data = await response.json()
        await renderPoke(data)
        hideSpinner()

    }catch (error){
        if (pokeLen === 0) show404()
        console.error(`There was an error during the request: ${error}`)
        hideSpinner()
    }
    
}

// funzione per renderizzare pokemon 

async function renderPoke(data) {
    try{
        const pokeCard = document.createElement('div')
        const pokeName = document.createElement ('h2')
        const pokeImg = document.createElement('img')
        const statsDiv = document.createElement('div')
        const leftDiv = document.createElement('div')
        const pokeTypes = document.createElement ('img')
        const pokeType2Img = document.createElement('img')
        const weight = document.createElement('p')
        const NumberPokedex = document.createElement('h3')
        const Height = document.createElement('p')

        pokeCard.className = 'Poke-container'
        statsDiv.className = 'statsDiv'
        leftDiv.className = 'leftDiv'
        pokeName.textContent = data.name


        //immagine sorgente
        const urlImg = 
            data.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default ||
            data.sprites?.front_default ||
            'https://pbs.twimg.com/media/ERPDVqzWAAUwLRl.png'; 

        pokeImg.src = urlImg
        NumberPokedex.textContent = `${data.id}°`
        leftDiv.appendChild(NumberPokedex)
        await leftDiv.appendChild(pokeImg)
        leftDiv.appendChild(pokeName)

        //gestione tipo del pokemon
        const pokeType1 = data.types?.[0]?.type?.name
        pokeCard.classList.add(pokeType1);
        //chimata primo tipo
        const pokeTypesUrl = data.types?.[0].type.url
        const responseType = await fetch(pokeTypesUrl)
        const dataType = await responseType.json()
        pokeTypes.src = 
            dataType.sprites?.['generation-ix']?.['scarlet-violet'].name_icon || 
            dataType.sprites?.['generation-v']?.['black-white'].name_icon

        leftDiv.appendChild(pokeTypes)

        //chiamata secondo tipo se esiste
        const pokeType2 = data.types?.[1]?.type?.name
        if (pokeType2) {
            pokeCard.classList.add(pokeType2);
            const response2Type = await fetch(data.types?.[1].type.url)
            const data2Type = await response2Type.json()
            pokeType2Img.src = 
                data2Type.sprites?.['generation-ix']?.['scarlet-violet'].name_icon || 
                data2Type.sprites?.['generation-v']?.['black-white'].name_icon

            leftDiv.appendChild(pokeType2Img)
        }

        setPokeGradient(pokeCard, pokeType1, pokeType2)

        // ciclo for per statistiche 
        pokeCard.addEventListener('click', async (e) => {
            if (!pokeCard.classList.contains('clicked')) {

                for (const stats of data.stats) {
                    const pokestats = document.createElement('p')
                    weight.textContent = `weight: ${data.weight / 10} kg`
                    Height.textContent = `Height: ${data.height / 10} m`
                    pokestats.textContent = `${stats.stat.name}: ${stats.base_stat}`
                    await statsDiv.appendChild(pokestats)
                    pokeCard.classList.add('clicked')
                } 
                statsDiv.appendChild(weight)
                statsDiv.appendChild(Height)
                ; 
        }else{
            statsDiv.innerHTML = ''
            pokeCard.classList.remove('clicked')
        }
        })

        // funzione che mischia i colori usando css in base al tipo
        function setPokeGradient (element, type1, type2) {
            const rootStyles = getComputedStyle(document.documentElement)
            const color1 = rootStyles.getPropertyValue(`--type-${type1}`)?.trim() || '#000'
            const color2 = type2
                ? rootStyles.getPropertyValue(`--type-${type2}`)?.trim() || '#f2fbff'
                : rootStyles.getPropertyValue(`--type-base`)
            
            element.style.background = `linear-gradient(135deg, ${color1}, ${color2})`
        }
        
        pokeCard.appendChild(leftDiv)

        pokeCard.appendChild(statsDiv)
        pokebox.appendChild(pokeCard)

    }catch(error){
        console.error(`Error accured: ${error}`)
    }
    
}

// funzione per renderizzare tutti i pokemon ricercati per tipo

async function renderTypesPokemon (dataTypes) {
    const pokeLen = dataTypes.pokemon.length

    for (subjects of dataTypes.pokemon) {
        const pokemonForTypes = subjects.pokemon.url
        const response = await fetch(pokemonForTypes)
        const data = await response.json()
        renderPoke(data)
    }

    return pokeLen
}

//funzione per renderezziare tutti i pokemon ricercati per generazione

async function renderGenerationPokemon (dataGeneration) {
    const pokeLen = dataGeneration.pokemon_species.length

    for (subjects of dataGeneration.pokemon_species){
        const pokemonForGeneration = subjects.url
        const responseGeneration = await fetch (pokemonForGeneration)
        const dataGeneration = await responseGeneration.json()
        const pokeUrl = dataGeneration.varieties[0].pokemon.url
        const renderResponse = await fetch(pokeUrl)
        const renderData = await renderResponse.json()
        
        renderPoke(renderData)
    }

    console.log(pokeLen)
    return pokeLen
}

//funzione per pulire tutto 
function clearResearch(){
    pokebox.innerHTML = ''
    notFound.classList.remove('visible')
    pokebox.style.display = 'none'
}


//funzione per mostrare errore 404
function show404 () {
    notFound.classList.remove('visible')
    notFound.classList.add('visible')
}


// per nascondere e vedere lo spiner
const ShowSpinner = () => {
    pokeBall.style.visibility = 'visible'
    pokebox.classList.add('hidden')
}
const hideSpinner = () => {
    pokeBall.style.visibility = 'hidden'
    pokebox.classList.remove('hidden')
}

// funzione dello scroll con pulsante 
function scrollToBegin () {
    window.scrollTo({
        behavior: "smooth",
        top: 0
    })
}


async function callImgTypes(){
    try{
        let matchingLi
        for (let i = 1; i <= 19; i++) {
            const imgTypeUrl = `https://pokeapi.co/api/v2/type/${i}`
            const responseImg = await fetch(imgTypeUrl) 
            const dataImg = await responseImg.json()
            const typeName = dataImg.name
            
             matchingLi = document.getElementById(typeName)
            if(matchingLi){
                const typeImg = document.createElement('img')
                typeImg.src = 
                    dataImg.sprites?.['generation-ix']?.['scarlet-violet'].name_icon ||
                    dataImg.sprites?.['generation-v']?.['black-white'].name_icon
                matchingLi.appendChild(typeImg)
            }    
        } return matchingLi
    }catch (error){
        console.error(`Error accured in the advanced research: ${error}`)
    }
}

 //conto per limitare le selezioni
    let selectedCount = 0
    let selectedTypes = [];
    async function fetchSideBar(e) {
    try{
      
        // Se clicchi sul pulsante
        if (e.target.tagName === 'BUTTON') {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('shown');
            pokebox.innerHTML = ''
            if(selectedCount === 0) {
                 pokebox.innerHTML = ''
                 return
            }
            // usa il primo tipo selezionato
            if (selectedTypes.length === 1) {
                ShowSpinner()
                notFound.classList.remove('visible')
                pokebox.style.display = 'flex'
                const linkApiTypesSidebar = `https://pokeapi.co/api/v2/type/${selectedTypes[0]}`;
                const response = await fetch(linkApiTypesSidebar);
                const data = await response.json();

                if (data.pokemon.length === 0) {
                    show404()
                    hideSpinner()
                    return
                }
                //uso map per iterare tutti i nomi e ritornarli in un array
                const name1pokemon = data.pokemon.map(p => p.pokemon.name)
                for (const pokeNames of name1pokemon){
                    const linkApiName = `https://pokeapi.co/api/v2/pokemon/${pokeNames}`
                    const responseName = await fetch(linkApiName)
                    const dataName = await responseName.json()
                    
                    if (dataName.types.length === 1) renderPoke(dataName)
                }
                hideSpinner()
            
            }else{
                fetchDualType(selectedTypes[0], selectedTypes[1])
            }
            return; 
        }

        //  Se hai cliccato su un <li>
        const clickedLi = e.target.closest('li');
        if (!clickedLi) return;

        if (clickedLi.classList.contains('clicked')) {
            clickedLi.classList.remove('clicked');
            selectedTypes = selectedTypes.filter(type => type !== clickedLi.id)
            selectedCount--;
        } else {
            if (selectedCount >= 2) return;
            clickedLi.classList.add('clicked');
            selectedTypes.push(clickedLi.id);
            selectedCount++;
        }

    }catch(error) {
        console.error(`error accured fething the result in sidebar: ${error}`)
    }
}

async function fetchDualType(type1, type2) {
    try {
        ShowSpinner()
        pokebox.style.display = 'flex'
        notFound.classList.remove('visible')
        const response1 = await fetch(`https://pokeapi.co/api/v2/type/${type1}`);
        const data1 = await response1.json();
        const pokename1 = data1.pokemon.map(p => p.pokemon.name)

        const response2 = await fetch(`https://pokeapi.co/api/v2/type/${type2}`);
        const data2 = await response2.json();
        const pokename2 = data2.pokemon.map(p => p.pokemon.name)

        // Filtra solo quelli presenti in entrambi  
        const dualType = pokename1.filter(name => pokename2.includes(name))

        if (dualType.length === 0) {
            show404()
            hideSpinner()
            return
        }
        

        for (const name of dualType) {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
            const data = await response.json();
            renderPoke(data); 
        }
        hideSpinner()

    } catch (error) {
        console.error("Error accured in sidebar types research:", error);
    }
}

// funzione per prendere un pokemon a caso
function shufflePokedex(){
    //aggiunge e poco dopo rimuove la classe di animazione per il click del pulsante
    ShuffleBtn.classList.add('bop')

    setTimeout(() => {
        ShuffleBtn.classList.remove('bop')
    }, 300);
    //numero a caso per id del pokemon (due diversi perchè PokeApi dopo il 1025 passa al 10001)
    let randomArray = []
    const randomNum = Math.floor(Math.random()* 1025 ) + 1
    randomArray.push(randomNum)
    const randomNum2 = Math.floor(Math.random() * (10277 - 10001 + 1)) + 10001
    randomArray.push(randomNum2)
    search(randomArray[Math.floor(Math.random()* 2)])
    
}

// funzione per prendere un pokemon a caso
function shufflePokedex(){
    //aggiunge e poco dopo rimuove la classe di animazione per il click del pulsante
    ShuffleBtn.classList.add('bop')

    setTimeout(() => {
        ShuffleBtn.classList.remove('bop')
    }, 300);
    //numero a caso per id del pokemon (due diversi perchè PokeApi dopo il 1025 passa al 10001)
    let randomArray = []
    const randomNum = Math.floor(Math.random()* 1025 ) + 1
    randomArray.push(randomNum)
    const randomNum2 = Math.floor(Math.random() * (10277 - 10001 + 1)) + 10001
    randomArray.push(randomNum2)
    search(randomArray[Math.floor(Math.random()* 2)])
    
}