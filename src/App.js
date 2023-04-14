import { useState, useRef, useEffect } from "react";
import allowedValues from "./allowedValues.json";
import importScript from "./importScript";

function App() {
  const [step, setStep] = useState(1);
  const [number, setNumber] = useState("");
  // let [animating, setAnimating] = useState(false); // define the animating variable using useState
  const [current_fs, setCurrent_fs] = useState(1); // define the current_fs variable using useState
  const fieldsets = useRef(document.querySelectorAll("fieldset"));
  const [selectedKey, setSelectedKey] = useState(null);
  const [isInputValid, setIsInputValid] = useState(true);
  const inputRef = useRef(null);
  // prettier-ignore
  const defaultPattern = "^([0-9A-Za-zŠĐČĆŽšđčćž,.:+?'/)( -]+)$";
  let currentIndex = 0;
  let stepIssues = 0;
  let isValid = true;

  const handleScriptLoad = () => {
    setIsScriptLoaded(true);
  };

  function showFieldset(index) {
    fieldsets[currentIndex].classList.remove("active");
    fieldsets[index].classList.add("active");
    fieldsets[index].classList.show();
    currentIndex = index;
  }

  function sanitizeInput(input) {
    if (input.length > 0) {
      return input.trim().toUpperCase().replace(/\n+/g, " ").replace(/  +/g, " ");
    } else {
      return "";
    }
  }

  function sanitizeIBAN(input) {
    var IBAN = require("fast-iban");
    const regex = /^[A-Za-z]{2}\d{19,30}$/; //regex pattern for validating input
    const sanitizedInput = sanitizeInput(input); //convert all lowercase to uppercase
    if (regex.test(sanitizedInput) && IBAN.validateIBAN(sanitizedInput)) {
      return true;
    }
    return false;
  }

  function sanitizeCode(input) {
    return allowedValues.code.includes(input);
  }

  function sanitizeCurrency(input) {
    return allowedValues.currency.includes(input);
  }

  function sanitizeDesc(input) {
    const regex = new RegExp(`${defaultPattern.slice(0, -1)}{5,35}$`, "u"); //regex pattern for validating input
    const sanitizedInput = sanitizeInput(input).slice(0, 35); //convert all newlines to spaces and set the max width
    if (regex.test(sanitizedInput)) {
      return true;
    }
    return false;
  }

  const canvasRef = useRef(null);

  const canvas = document.getElementById("barcode");
  const error_canvas = useRef();
  let ctx = null;

  // initialize the canvas context
  useEffect(() => {
    // dynamically assign the width and height to canvas
    const canvasEle = error_canvas.current;
    canvasEle.width = canvasEle.clientWidth;
    canvasEle.height = canvasEle.clientHeight;

    // get context of the canvas
    ctx = canvasEle.getContext("2d");
  }, []);

  const handleChange = (event) => {
    let input = event.target.value;

    // Remove any non-digit characters
    input = input.replace(/[\D]/g, "").replace(/^0+/, "");

    // Add decimal comma when input is longer than 2 digits
    // Format the input based on its length
    if (input.length === 1) {
      input = "0,0" + input;
    } else if (input.length === 2) {
      input = "0," + input;
    } else if (input.length > 2) {
      input = input.slice(0, -2) + "," + input.slice(-2);
      let separatorIndex = 0;
      let last3 = "";
      let dec = 0;
      if (separatorIndex >= 0) {
        last3 = input.slice(-3);
        dec = 1;
      }
      separatorIndex = input.length - 3;
      input = input.substring(0, separatorIndex);
      separatorIndex = input.length - 3;
      while (separatorIndex > 0) {
        input = input.slice(0, separatorIndex) + "." + input.slice(separatorIndex);
        separatorIndex -= 3;
      }
      if (dec) input = input + last3;
    }

    setNumber(input);
    event.target.value = input; // update the value of the input field
  };

  const handlePrevious = () => {
    // if (animating) return;
    // setAnimating(true);
    setStep(step - 1);

    // Set fieldsets
    const current_fs = document.getElementById("step-" + step);
    const previous_fs = document.getElementById("step-" + (step - 1));

    // show the next fieldset
    current_fs.style.display = "none";
    previous_fs.style.display = "block";
    addCurrent((step - 1).toString());

    // De-activate current step on progressbar
    const progressbarLis = document.querySelectorAll("#progressbar li");
    const currentIndex = Array.from(document.querySelectorAll("fieldset")).indexOf(current_fs);
    progressbarLis[currentIndex].classList.remove("active");
  };

  const handleInput = (event) => {
    let input = event.target;
    if (input.checkValidity()) {
      setIsInputValid(true);
      event.target.classList.remove("input-invalid");
    } else {
      setIsInputValid(false);
      event.target.classList.add("input-invalid");
    }
  };

  const handleIBAN = (event) => {
    let input = event.target.value;
    let valid = sanitizeIBAN(input);
    if (valid) {
      setIsInputValid(true);
      event.target.classList.remove("input-invalid");
    } else {
      setIsInputValid(false);
      event.target.classList.add("input-invalid");
    }
  };

  const handleDesc = (event) => {
    let input = event.target.value;
    let valid = sanitizeDesc(input);
    if (valid) {
      setIsInputValid(true);
      event.target.classList.remove("input-invalid");
    } else {
      setIsInputValid(false);
      event.target.classList.add("input-invalid");
    }
  };

  const handleCode = (event) => {
    const input = sanitizeInput(event.target.value);
    if (sanitizeCode(input)) {
      setIsInputValid(true);
      event.target.classList.remove("input-invalid");
    } else {
      setIsInputValid(false);
      event.target.classList.add("input-invalid");
    }
  };

  const handleCurrency = (event) => {
    const input = sanitizeInput(event.target.value);
    if (sanitizeCurrency(input)) {
      setIsInputValid(true);
      event.target.classList.remove("input-invalid");
    } else {
      setIsInputValid(false);
      event.target.classList.add("input-invalid");
    }
  };

  const handleProgress = (event) => {
    const step = event.target.closest("fieldset").id.replace(/[^0-9]/g, "");
    if (step) {
      checkStep(step);
    }
  };

  // write a text
  const writeText = (info, style = {}) => {
    const { text, x, y } = info;
    const {
      fontSize = 20,
      fontFamily = "montserrat, arial, verdana",
      color = "#8D3B72",
      textAlign = "left",
      textBaseline = "top",
    } = style;

    ctx.beginPath();
    ctx.font = fontSize + "px " + fontFamily;
    ctx.textAlign = textAlign;
    ctx.textBaseline = textBaseline;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.stroke();
  };

  const hideCanvas = async () => {
    if (canvas) {
      canvas.style.display = "none";
    }
  };

  const addCurrent = (n) => {
    // Remove any previously added styles that contain the ".stop-animation" class
    const prevStyles = document.querySelectorAll(".stop-animation");
    prevStyles.forEach((style) => {
      style.remove();
    });
    const style = document.createElement("style");
    style.classList.add("stop-animation");
    style.innerHTML = "#progressbar li:nth-child(" + n + ")::before { animation: pulse 0.9s infinite; }";
    document.head.appendChild(style);
  };

  const addAlert = (n) => {
    const li = document.querySelector(`#progressbar li:nth-child(${n})`);
    const beforeStyle = window.getComputedStyle(li, "::before").cssText;
    li.style.setProperty("--before-style", li.style.cssText);
    li.style.cssText = beforeStyle;
    li.classList.add("stop-alert");
  };

  const removeAlert = (n) => {
    const li = document.querySelector(`#progressbar li:nth-child(${n})`);
    if (li) {
      li.classList.remove("stop-alert");
    }
  };

  const checkStep = (n) => {
    // check if all required input elements are valid
    const form = document.getElementById("msform");
    const inputs = form.querySelectorAll(
      "#step-" + n + " input[type='text']:not([id*='iban']):not([id*='code']):not([id*='currency'])"
    ); // Select all inputs except id="iban"
    stepIssues = 0;

    for (let i = 0; i < inputs.length; i++) {
      if (
        (inputs[i].hasAttribute("required") && !inputs[i].checkValidity()) ||
        (!inputs[i].hasAttribute("required") && !inputs[i].length && !inputs[i].checkValidity())
      ) {
        inputs[i].classList.add("input-invalid");
        stepIssues = 1;
        addAlert(n);
      } else {
        inputs[i].classList.remove("input-invalid");
      }
    }

    if (n != 3) {
      // if all is good in all steps before the last one
      if (stepIssues == 0) {
        removeAlert(n);
      }
    } else {
      if (stepIssues == 0) {
        // if all is good in the last step, proceed with additional validation
        let currency = sanitizeInput(document.getElementById("currency").value);
        let iban = sanitizeInput(document.getElementById("iban").value);
        let code = sanitizeInput(document.getElementById("code").value);
        let desc = sanitizeInput(document.getElementById("desc").value);

        if (
          !(
            iban.length &&
            sanitizeIBAN(iban) &&
            code.length &&
            sanitizeCode(code) &&
            currency.length &&
            sanitizeCurrency(currency) &&
            desc.length &&
            sanitizeDesc(desc)
          )
        ) {
          stepIssues = 1;
          addAlert(n);
        } else {
          // No issues within the step-3
          removeAlert(n);
          document.getElementById("currency").classList.remove("input-invalid");
          document.getElementById("iban").classList.remove("input-invalid");
          document.getElementById("code").classList.remove("input-invalid");
          document.getElementById("desc").classList.remove("input-invalid");
        }
      }
    }
  };

  const generateBarcode = async (event) => {
    event.preventDefault(); // prevent default link behavior
    isValid = true;

    const name_s = sanitizeInput(document.getElementById("name_s").value);
    const address_s = sanitizeInput(document.getElementById("address_s").value);
    let zip_s = sanitizeInput(document.getElementById("zip_s").value);
    const city_s = sanitizeInput(document.getElementById("city_s").value);
    const name_r = sanitizeInput(document.getElementById("name_r").value);
    const address_r = sanitizeInput(document.getElementById("address_r").value);
    let zip_r = sanitizeInput(document.getElementById("zip_r").value);
    const city_r = sanitizeInput(document.getElementById("city_r").value);
    let value = sanitizeInput(document.getElementById("value").value);
    const currency = sanitizeInput(document.getElementById("currency").value);
    const iban = sanitizeInput(document.getElementById("iban").value);
    let code = sanitizeInput(document.getElementById("code").value);
    let model = sanitizeInput(document.getElementById("model").value);
    const c2n = sanitizeInput(document.getElementById("c2n").value);
    const desc = sanitizeInput(document.getElementById("desc").value);

    // Setting defaults
    if (!code) {
      document.getElementById("code").value = "COST";
      code = "COST";
    }

    if (!model) {
      document.getElementById("model").value = "HR00";
      model = "HR00";
    }

    checkStep(1);
    if (stepIssues > 0) {
      isValid = false;
    }
    checkStep(2);
    if (stepIssues > 0) {
      isValid = false;
    }
    checkStep(3);
    if (stepIssues > 0) {
      isValid = false;
    }

    value = value.replace(/\D/g, "");
    let s = "00000000000000" + value;
    value = s.slice(s.length - 15);

    if (!c2n.length) {
      model = "";
    }

    if (zip_s.length > 0) {
      zip_s = zip_s.match(/\d/g).join("");
    }

    if (zip_r.length > 0) {
      zip_r = zip_r.match(/\d/g).join("");
    }

    var barcode =
      "HRVHUB30\n" +
      currency +
      "\n" +
      value +
      "\n" +
      name_s +
      "\n" +
      address_s +
      "\n" +
      zip_s +
      " " +
      city_s +
      "\n" +
      name_r +
      "\n" +
      address_r +
      "\n" +
      zip_r +
      " " +
      city_r +
      "\n" +
      iban +
      "\n" +
      model +
      "\n" +
      c2n +
      "\n" +
      code +
      "\n" +
      desc.replace(/\n/g, " ").slice(0, 35) +
      "\n";

    if (canvas && isValid) {
      PDF417.draw(barcode, canvas, 2.667, 6, 2);
      canvas.style.display = "block";
    } else {
      // dynamically assign the width and height to canvas
      let clientWidth = 300;
      let clientHeight = 40;
      const canvasEle = error_canvas.current;
      canvasEle.width = clientWidth;
      canvasEle.height = clientHeight;

      // get context of the canvas
      ctx = canvasEle.getContext("2d");
      canvas.style.display = "block";
      writeText({ text: "Nepotpuni podaci!", x: 56, y: 10 });
    }
  };

  const handleNext = async () => {
    // if (animating) return false;
    // animating = true;
    setStep(step + 1);

    if (currentIndex < fieldsets.length - 1) {
      showFieldset(currentIndex + 1);
    }

    const current_fs = document.getElementById("step-" + step);
    const next_fs = document.getElementById("step-" + (step + 1));

    // activate next step on progressbar using the index of next_fs
    document.querySelectorAll("#progressbar li")[step].classList.add("active");

    // show the next fieldset
    current_fs.style.display = "none";
    next_fs.style.display = "block";
    addCurrent((step + 1).toString());

    // hide the current fieldset with style
    let left, opacity, scale;
    current_fs.animate(
      { opacity: 0 },
      {
        step: function (now, mx) {
          // as the opacity of current_fs reduces to 0 - stored in "now"
          // 1. scale current_fs down to 80%
          scale = 1 - (1 - now) * 0.2;
          // 2. bring next_fs from the right(50%)
          left = now * 50 + "%";
          // 3. increase opacity of next_fs to 1 as it moves in
          opacity = 1 - now;
          current_fs.style.transform = "scale(" + scale + ")";
          current_fs.style.position = "absolute";
          next_fs.style.left = left;
          next_fs.style.opacity = opacity;
        },
        duration: 800,
        complete: function () {
          current_fs.style.display = "none";
          // animating = false;
          setStep(step + 1);
        },
        // this comes from the custom easing plugin: easeInOutBack
        easing: "ease",
      }
    );
  };

  return (
    <div>
      {/* multistep form */}
      <form id="msform">
        {/* progressbar */}
        <ul id="progressbar">
          <li className="active">Platitelj</li>
          <li>Primatelj</li>
          <li>Iznos</li>
        </ul>
        {/* fieldsets */}
        <fieldset id="step-1" className={current_fs === 1 ? "active" : ""}>
          <h2 className="fs-title">Platitelj</h2>
          <h3 className="fs-subtitle">Tko uplaćuje iznos?</h3>
          <input
            id="name_s"
            type="text"
            name="name_s"
            placeholder="Ime i prezime"
            onChange={(e) => {
              hideCanvas(e);
              handleInput(e);
              handleProgress(e);
            }}
            maxLength="30"
            pattern={defaultPattern}
            flags="u"
          />
          <input
            id="address_s"
            type="text"
            name="adress_s"
            placeholder="Adresa"
            onChange={(e) => {
              hideCanvas(e);
              handleInput(e);
              handleProgress(e);
            }}
            maxLength="27"
            pattern={defaultPattern}
            flags="u"
          />
          <div className="side-by-side">
            <input
              id="zip_s"
              className="zip"
              type="text"
              name="zip_s"
              placeholder="Po. br."
              onChange={(e) => {
                hideCanvas(e);
                handleInput(e);
                handleProgress(e);
              }}
              maxLength="5"
              pattern="^[0-9]{5}$"
            />
            <input
              id="city_s"
              type="text"
              name="city_s"
              placeholder="Grad"
              onChange={(e) => {
                hideCanvas(e);
                handleInput(e);
                handleProgress(e);
              }}
              maxLength="21"
              pattern={defaultPattern}
              flags="u"
            />
          </div>
          <input type="button" name="previous" className="disabled previous action-button" value="Natrag" disabled="" />
          <input
            type="button"
            name="next"
            className="next action-button"
            value="Nastavi"
            onClick={handleNext}
            onChange={hideCanvas}
          />
        </fieldset>
        <fieldset id="step-2" className={current_fs === 2 ? "active" : ""}>
          <h2 className="fs-title">Primatelj</h2>
          <h3 className="fs-subtitle">Kome se uplaćuje?</h3>
          <input
            id="name_r"
            type="text"
            name="name_r"
            placeholder="Ime i prezime"
            onChange={(e) => {
              hideCanvas(e);
              handleInput(e);
              handleProgress(e);
            }}
            maxLength="25"
            required
            pattern={defaultPattern}
            flags="u"
          />
          <input
            id="address_r"
            type="text"
            name="adress_r"
            placeholder="Adresa"
            onChange={(e) => {
              hideCanvas(e);
              handleInput(e);
              handleProgress(e);
            }}
            maxLength="25"
            required
            pattern={defaultPattern}
            flags="u"
          />
          <div className="side-by-side">
            <input
              id="zip_r"
              className="zip"
              type="text"
              name="zip_r"
              placeholder="Po. br."
              onChange={(e) => {
                hideCanvas(e);
                handleInput(e);
                handleProgress(e);
              }}
              maxLength="5"
              required
              pattern="^[0-9]{5}$"
            />
            <input
              id="city_r"
              type="text"
              name="city_r"
              placeholder="Grad"
              onChange={(e) => {
                hideCanvas(e);
                handleInput(e);
                handleProgress(e);
              }}
              maxLength="21"
              required
              pattern={defaultPattern}
              flags="u"
            />
          </div>
          <input
            type="button"
            name="previous"
            className="previous action-button"
            value="Natrag"
            onClick={handlePrevious}
          />
          <input type="button" name="next" className="next action-button" value="Nastavi" onClick={handleNext} />
        </fieldset>
        <fieldset id="step-3" className={current_fs === 3 ? "active" : ""}>
          <h2 className="fs-title">Podaci o uplati</h2>
          <h3 className="fs-subtitle">Iznos i broj računa?</h3>
          <div className="side-by-side">
            <input
              id="value"
              type="text"
              name="value"
              className="bold"
              placeholder="Iznos"
              value={number || ""}
              onChange={(e) => {
                hideCanvas(e);
                handleChange(e);
                handleProgress(e);
              }}
              required
              pattern="^[0-9.,]+$"
              maxLength="19"
            />
            <input
              id="currency"
              type="text"
              name="currency"
              defaultValue="EUR"
              placeholder="Valuta"
              onChange={(e) => {
                hideCanvas(e);
                handleCurrency(e);
                handleProgress(e);
              }}
              required
              pattern="^([a-zA-Z]{3})$"
              maxLength="3"
            />
          </div>
          <div className="side-by-side">
            <input
              id="iban"
              type="text"
              name="IBAN"
              placeholder="IBAN"
              onChange={(e) => {
                hideCanvas(e);
                handleIBAN(e);
                handleProgress(e);
              }}
              required
              pattern="^([hH][rR])([0-9]{19})$"
              maxLength="21"
            />
            <input
              id="code"
              type="text"
              name="code"
              placeholder="Šifra"
              defaultValue={selectedKey || "COST"}
              onChange={(e) => {
                hideCanvas(e);
                handleCode(e);
                handleProgress(e);
              }}
              pattern="^[a-zA-Z]{4}$"
              maxLength="4"
            />
          </div>
          <div className="side-by-side">
            <input
              id="model"
              type="text"
              name="model"
              defaultValue="HR00"
              placeholder="Model"
              onChange={(e) => {
                hideCanvas(e);
                handleInput(e);
                handleProgress(e);
              }}
              pattern="^([hH][rR])([0-9]{2})$"
              maxLength="4"
            />
            <input
              id="c2n"
              type="text"
              name="c2n"
              placeholder="Poziv na broj"
              onChange={(e) => {
                hideCanvas(e);
                handleInput(e);
                handleProgress(e);
              }}
              pattern={defaultPattern}
              flags="u"
              maxLength="22"
            />
          </div>
          <textarea
            id="desc"
            name="desc"
            placeholder="Opis plaćanja"
            onChange={(e) => {
              hideCanvas(e);
              handleDesc(e);
              handleProgress(e);
            }}
            required
            pattern={defaultPattern}
            flags="u"
            maxLength="35"
          ></textarea>
          <input
            type="button"
            name="previous"
            className="previous action-button"
            value="Natrag"
            onClick={handlePrevious}
          />
          <a className="submit action-button" target="_top" onClick={generateBarcode}>
            PRIKAŽI
          </a>
        </fieldset>
      </form>
      <canvas ref={error_canvas} id="barcode"></canvas>
    </div>
  );
}

export default App;
