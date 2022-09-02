const controls = {
  updateInterval: 100,
  interval: 100,


  getAllContinentsAndCountries: function(data) {
    const concat  = (x, y)  => x.concat(y)
    const flatMap = (f, xs) => xs.map(f).reduce(concat, [])

    const tuples = flatMap(year => year.map(c => [c.continent, c.country]), data);
    const allContinents = tuples.map(tup => tup[0]);
    const continents = [...new Set(allContinents)];

    return continents.map(continent => {
      const countries = tuples.filter(tup => tup[0] === continent).map(tup => tup[1]);
      return {"continent": continent, "countries": [...new Set(countries)]};
    });
  },

  changeCountrySelection: function(continentName, action) {
    const continentList = document.getElementById("list" + continentName);
    const inputs = continentList.querySelectorAll("input");

    var getState;
    if (action === "all") {
      getState = state => true;
    } else if (action === "none") {
      getState = state => false;
    } else { // Invert
      getState = state => !state;
    }

    inputs.forEach(input => input.checked = getState(input.checked));
    d3graph.updateGraph();
  },

  getCheckboxNameForCountry: function(country) {
    return "checkbox" + country.replace(/[\W]+/g, "_");
  },

  addContinentsToDropdown: function(data) {
    const listDiv = document.getElementById('countriesAndContinentsList');

    this.getAllContinentsAndCountries(data)
      .sort()
      .forEach(d => {
        const continentName = d.continent.charAt(0).toUpperCase() + d.continent.slice(1);

        const continentDiv = document.createElement('div');
        continentDiv.setAttribute("class", "continentDiv");
        const header = document.createElement('h3');
        header.appendChild(document.createTextNode(continentName));

        const createButtonFunction = (action, tooltip, buttonClass) => {
          const button = document.createElement('button');
          const icon = document.createElement('i');
          icon.setAttribute("class", buttonClass);

          button.onclick = () => this.changeCountrySelection(continentName, action);
          button.setAttribute("class", "btn");
          button.title = tooltip;
          button.appendChild(icon);
          return button;
        };

        const allButton    = createButtonFunction("all", "Select every country in " + continentName, "fas fa-check-square");
        const noneButton   = createButtonFunction("none", "Deselect every country in " + continentName, "far fa-square");
        const invertButton = createButtonFunction("invert", "Invert current selection of countries in " + continentName, "far fa-share-square");
        const groupBox     = document.createElement('fieldset');
        const legend       = document.createElement('legend');
        legend.appendChild(document.createTextNode("Selection"));
        groupBox.appendChild(legend);
        groupBox.appendChild(allButton);
        groupBox.appendChild(noneButton);
        groupBox.appendChild(invertButton);



        const continentList = document.createElement('ul');
        continentList.id = "list" + continentName;

        continentDiv.appendChild(header);
        continentDiv.appendChild(groupBox);
        continentDiv.appendChild(continentList);
        listDiv.appendChild(continentDiv);

        d.countries.sort().forEach(country => {
          const item    = document.createElement('li');
          const input   = document.createElement('input');
          const id      = this.getCheckboxNameForCountry(country);

          input.type    = "checkbox";
          input.class   = "checkbox";
          input.id      = id;
          input.name    = id;
          input.checked = true;
          input.onclick = () => d3graph.updateGraph();

          const label = document.createElement('label')
          label.htmlFor = id;
          label.appendChild(document.createTextNode(country));

          item.appendChild(input);
          item.appendChild(label);
          continentList.appendChild(item);
        });
      });
  },



  addSlider: function(firstYear, lastYear) {
    const slider = document.getElementById('year-slider');

    noUiSlider.create(slider, {
      start: [firstYear],
      step: 1,
      animate: false,
      connect: [true, false],
      tooltips: [wNumb({prefix: "Year: ", decimals: 0})],
      range: {
          'min': firstYear,
          'max': lastYear
      }
    });

    const fnk = () => {
      d3graph.year = slider.noUiSlider.get() - firstYear;
      d3graph.updateGraph();
    };
    slider.noUiSlider.on('update', fnk);
    slider.noUiSlider.on('set', fnk);
  },

  setUpdateSpeed: function() {
    const dropdown = document.getElementById("speed-select");
    const speedSelection = dropdown.options[dropdown.selectedIndex].value
    this.updateInterval = speedSelection;

    const playBtnText = document.getElementById('playpausetext').innerText;
    if (playBtnText == "Pause") {
      clearInterval(this.interval);
      this.interval = setInterval(this.stepToNextYear, this.updateInterval);
    }
  },


  getMinInData: function(data, property) {
    return this.getExtremeInData(data, property, d3.min);
  },
  getMaxInData: function(data, property) {
    return this.getExtremeInData(data, property, d3.max);
  },
  getExtremeInData: function(data, property, maxMin) {
    const extremeAmongCountries = d => maxMin(d, country => property(country));
    return maxMin(data, year => extremeAmongCountries(year));
  },

  setup: function(data) {
    this.setUpdateSpeed();
    this.setElementAttributes();

    const minIncome     = this.getMinInData(data, country => country.income);
    const maxIncome     = this.getMaxInData(data, country => country.income);
    const minPopulation = this.getMinInData(data, country => country.population);
    const maxPopulation = this.getMaxInData(data, country => country.population);
    const maxLifeExp    = this.getMaxInData(data, country => country.life_exp);

    const lowerIncome   = Math.pow(10, Math.floor(Math.log10(minIncome)));
    const higherIncome  = Math.pow(10, Math .ceil(Math.log10(maxIncome)));
    const xAxisTicks    = [];
    for (var i = lowerIncome; i <= higherIncome; i *= 10) {
      xAxisTicks.push(i);
    }

    d3graph.setupScales(lowerIncome, maxIncome, maxLifeExp, minPopulation, maxPopulation);
    d3graph.addAxis(xAxisTicks);
    d3graph.addLegend(this.getAllContinentsAndCountries(data));
    this.addSlider(d3graph.getFirstYear(), d3graph.getLastYear());

    this.broadcastSetupComplete();
  },

  broadcastSetupComplete: function() {
    // Broadcast that setup of the controls is finished, to whomever might care
    window.postMessage("finished gapminder controls setup", "*");
  },

  cleanData: function(data) {
    return data.map(year => {
        return year["countries"]
          .filter(country => country.income && country.life_exp)
          .map(country => {
            country.income = +country.income;
            country.life_exp = +country.life_exp;
            return country;
          });
      });
  },

  stepToNextYear: function() {
    d3graph.year = (d3graph.year < d3graph.getLastYear() - d3graph.getFirstYear()) ? d3graph.year + 1 : 0;
    const slider = document.getElementById('year-slider');
    slider.noUiSlider.set(d3graph.year + d3graph.getFirstYear());
    d3graph.updateGraph();
  },

  setMenuVisibility: function(show) {
    const menu = document.getElementById('countriesAndContinentsList');

    menu.style.visibility = show ? "visible" : "hidden";
    menu.style.opacity    = show ? 1 : 0;
    menu.style.zIndex     = show ? 1 : -1;
  },

  getWidthOfGraph: function() {
    const countriesAndContinentsList = document.getElementById('countriesAndContinentsList');
    const styles = window.getComputedStyle(countriesAndContinentsList);

    return Math.max(countriesAndContinentsList.offsetWidth, d3graph.totalWidth);
  },

  setElementAttributes: function() {
    document
      .getElementById('play-button')
      .addEventListener('click', event => {
        const btn = document.getElementById("playpausetext");

        if (btn.innerText == "Pause") {

          document.getElementById('playicon') .setAttribute('style', 'display: inline-block;');
          document.getElementById('pauseicon').setAttribute('style', 'display: none;');
          btn.innerText = "Play";
          clearInterval(this.interval);

        } else {

          document.getElementById('playicon') .setAttribute('style', 'display: none;');
          document.getElementById('pauseicon').setAttribute('style', 'display: inline-block;');
          btn.innerText = "Pause";
          this.interval = setInterval(this.stepToNextYear, this.updateInterval);
        }
      });

    document
      .getElementById('speed-select')
      .addEventListener('change', () => this.setUpdateSpeed());

    document
      .getElementById('playicon')
      .setAttribute('style', 'display: none;');

    const countriesButton = document.getElementById('countries-button');
    const countriesMenu   = document.getElementById('countriesAndContinentsList');
    countriesButton.addEventListener('mouseover', () => this.setMenuVisibility(true));
    countriesButton.addEventListener('mouseout',  () => this.setMenuVisibility(false));
    countriesButton.addEventListener('focus',     () => this.setMenuVisibility(true));
    countriesButton.addEventListener('blur',      () => this.setMenuVisibility(false));
    countriesMenu  .addEventListener('mouseover', () => this.setMenuVisibility(true));
    countriesMenu  .addEventListener('mouseout',  () => this.setMenuVisibility(false));
  }
};
