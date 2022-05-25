const HIDDEN_FORM_NAME = `countryCode`;

const dropdown = document.querySelector(`[data-element="dropdown"]`);
dropdown.style.pointerEvents = "none";

document.addEventListener("DOMContentLoaded", async () => {
  const templateItemNode = document.querySelector(`[data-element="item"]`);
  const list = document.querySelector(`[data-element="list"]`);
  const topPrefix = document.querySelector('[data-element="value"]');
  const topFlag = document.querySelector(`[data-element="flag"]`);

  let lastSelected = null;
  let currentEl = null;

  const getCountries = async () => {
    let url = "https://restcountries.com/v3.1/all";
    const response = await fetch(url);
    const data = await response.json();
    return data;
  };

  const getPrefix = (idd) => {
    let prefix = idd.root;
    if (idd.suffixes?.[0] && idd.suffixes?.[0].length < 3) {
      prefix += idd.suffixes?.[0];
    }
    prefix = prefix ? prefix : ``;
    return prefix;
  };

  const createList = async () => {
    list.replaceChildren();
    const countries = await getCountries();
    countries.forEach((country) => {
      const name = country.name.common;
      const cca2 = country.cca2;
      const svgUrl = country.flags.svg;
      const prefix = getPrefix(country.idd);

      if (templateItemNode) {
        let newItemNode = templateItemNode.cloneNode(true);
        newItemNode.title = name;
        newItemNode.ariaLabel = name;

        newItemNode.querySelector(`[data-element="flag"]`).src = svgUrl;
        newItemNode.querySelector(`[data-element="flag"]`).alt = `${name} Flag`;
        newItemNode.querySelector(`[data-element="value"]`).innerHTML = cca2;
        newItemNode.setAttribute(`data-cca2`, cca2);
        newItemNode
          .querySelector(`[data-element="value"]`)
          .setAttribute(`data-prefix`, prefix);

        list.append(newItemNode);
      }
    });
  };

  const selectFromList = (selectedEl) => {
    if (lastSelected) {
      lastSelected.classList.remove("w--current");
      lastSelected.ariaSelected = false;
    }
    selectedEl.classList.add("w--current");
    selectedEl.ariaSelected = true;

    topPrefix.innerHTML = selectedEl
      .querySelector('[data-element="value"]')
      .getAttribute(`data-prefix`);
    topFlag.src = selectedEl.querySelector(`[data-element="flag"]`).src;

    lastSelected = selectedEl;
    currentEl = selectedEl;

    document.querySelector(`input[name="${HIDDEN_FORM_NAME}"]`).value =
      topPrefix.innerHTML;
  };

  const closeDropdown = () => {
    $(`[data-element="list"]`).trigger(`w-close`);
  };

  const selectUserCountryOnLoad = async () => {
    const url = `https://www.cloudflare.com/cdn-cgi/trace`;
    const response = await fetch(url);
    let data = await response.text();

    // Parses text response from cloudflare to json
    data = data.replace(/[\r\n]+/g, '","').replace(/\=+/g, '":"');
    data = '{"' + data.slice(0, data.lastIndexOf('","')) + '"}';
    data = JSON.parse(data);

    // Find the corresponding element
    const userCountryEl = list.querySelector(`[data-cca2="${data.loc}"]`);
    selectFromList(userCountryEl);
  };

  await createList();
  selectUserCountryOnLoad();
  dropdown.style.pointerEvents = "auto";

  list.querySelectorAll(`[data-element="item"]`).forEach((item) => {
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
        `[data-cca2^=${keyPressed}]`
      );
      firstElWithLetter.scrollIntoView({ block: `center` });
      selectFromList(firstElWithLetter);
    }
  });
});
