const HIDDEN_FORM_NAME = `countryCode`;
const DATA_FLAG_SELECT = `[data-element="flag"]`;
const DATA_VALUE_SELECT = `[data-element="value"]`;
const DATA_ITEM_SELECT = `[data-element="item"]`;
const DATA_LIST_SELECT = `[data-element="list"]`;
const CCA2_ATTR = `data-cca2`;
const PREFIX_ATTR = `data-prefix`;
const WEBFLOW_CURRENT_CLASSNAME = `w--current`;

const dropdown = document.querySelector(`[data-element="dropdown"]`);
// Disabled dropdown while populating data
dropdown.style.pointerEvents = "none";

document.addEventListener("DOMContentLoaded", async () => {
  //
  // SETUP SELECTORS
  //

  const templateItemNode = document.querySelector(DATA_ITEM_SELECT);
  const list = document.querySelector(DATA_LIST_SELECT);
  const topPrefix = document.querySelector(DATA_VALUE_SELECT);
  const topFlag = document.querySelector(DATA_FLAG_SELECT);

  // Keeps track of currently selected list item
  let currentEl = null;

  //
  // UTILITY FUNCTIONS
  //

  const getCountries = async () => {
    let url = "https://restcountries.com/v3.1/all";
    const response = await fetch(url);
    const data = await response.json();
    return data;
  };

  // Parse prefix
  // ref: https://en.wikipedia.org/wiki/List_of_mobile_telephone_prefixes_by_country
  const getPrefix = (idd) => {
    let prefix = idd.root;
    if (idd.suffixes?.[0] && idd.suffixes?.[0].length < 3) {
      prefix += idd.suffixes?.[0];
    }
    prefix = prefix ? prefix : ``;
    return prefix;
  };

  const createList = async () => {
    // clears the dropdown list before populating with country data
    list.replaceChildren();
    const countries = await getCountries();
    countries.forEach((country) => {
      const name = country.name.common;
      const cca2 = country.cca2;
      const svgUrl = country.flags.svg;
      const prefix = getPrefix(country.idd);

      // create, configure, and append the new node.
      if (templateItemNode) {
        let newItemNode = templateItemNode.cloneNode(true);
        newItemNode.title = name;
        newItemNode.ariaLabel = name;
        newItemNode.querySelector(DATA_FLAG_SELECT).src = svgUrl;
        newItemNode.querySelector(DATA_FLAG_SELECT).alt = `${name} Flag`;
        newItemNode.querySelector(DATA_VALUE_SELECT).innerHTML = cca2;
        newItemNode.setAttribute(CCA2_ATTR, cca2);
        newItemNode
          .querySelector(DATA_VALUE_SELECT)
          .setAttribute(PREFIX_ATTR, prefix);

        list.append(newItemNode);
      }
    });
  };

  // handles updating classes, arias, attrs on user select
  // stores selected country prefix in hidden form.
  const selectFromList = (selectedEl) => {
    if (currentEl) {
      currentEl.classList.remove(WEBFLOW_CURRENT_CLASSNAME);
      currentEl.ariaSelected = false;
    }
    selectedEl.classList.add(WEBFLOW_CURRENT_CLASSNAME);
    selectedEl.ariaSelected = true;

    // Indicate selection in top form.
    topPrefix.innerHTML = selectedEl
      .querySelector(DATA_VALUE_SELECT)
      .getAttribute(PREFIX_ATTR);
    topFlag.src = selectedEl.querySelector(DATA_FLAG_SELECT).src;

    // Update tracking var
    currentEl = selectedEl;

    // Update hidden form
    document.querySelector(`input[name="${HIDDEN_FORM_NAME}"]`).value =
      topPrefix.innerHTML;
  };

  const closeDropdown = () => {
    // Webflow jQuery to close dropdown.
    $(DATA_LIST_SELECT).trigger(`w-close`);
  };

  const selectUserCountryOnLoad = async () => {
    const url = `https://www.cloudflare.com/cdn-cgi/trace`;
    const response = await fetch(url);
    let data = await response.text();

    // Parses text response from cloudflare to json for ease
    data = data.replace(/[\r\n]+/g, '","').replace(/\=+/g, '":"');
    data = '{"' + data.slice(0, data.lastIndexOf('","')) + '"}';
    data = JSON.parse(data);

    // Find and select the corresponding element
    const userCountryEl = list.querySelector(`[${CCA2_ATTR}="${data.loc}"]`);
    selectFromList(userCountryEl);
  };

  //
  // EXECUTION
  //

  await createList();
  await selectUserCountryOnLoad();
  dropdown.style.pointerEvents = "auto";

  //
  // EVENT LISTENERS
  //

  list.querySelectorAll(DATA_ITEM_SELECT).forEach((item) => {
    item.addEventListener(`click`, (event) => {
      selectFromList(event.currentTarget);
      closeDropdown();
    });
  });

  dropdown.addEventListener(`click`, () => {
    if (!currentEl) return;
    setTimeout(() => {
      currentEl.scrollIntoView({ block: `center` });
    }, 0);
  });

  document.addEventListener(`keydown`, (event) => {
    if (document.activeElement !== dropdown.firstChild) return;
    const keyPressed = event.key.toUpperCase();
    if (keyPressed === "ARROWDOWN") {
      if (currentEl.nextSibling) {
        currentEl.nextSibling.scrollIntoView({ block: `center` });
        selectFromList(currentEl.nextSibling);
      }
    } else if (keyPressed === "ARROWUP") {
      if (currentEl.previousSibling) {
        currentEl.previousSibling.scrollIntoView({ block: `center` });
        selectFromList(currentEl.previousSibling);
      }
    } else if (keyPressed >= "A" && keyPressed <= "Z") {
      const firstElWithLetter = list.querySelector(
        `[${CCA2_ATTR}^=${keyPressed}]`
      );
      if (!firstElWithLetter) return;
      firstElWithLetter.scrollIntoView({ block: `center` });
      selectFromList(firstElWithLetter);
    }
  });
});
