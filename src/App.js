import { useState, useRef, useEffect } from "react";
import importScript from "./importScript";

function App() {
  const [step, setStep] = useState(1);
  const [number, setNumber] = useState("");
  // let [animating, setAnimating] = useState(false); // define the animating variable using useState
  const [current_fs, setCurrent_fs] = useState(1); // define the current_fs variable using useState
  const fieldsets = useRef(document.querySelectorAll("fieldset"));
  const [selectedKey, setSelectedKey] = useState(null);
  const [isInputValid, setIsInputValid] = useState(true);
  let currentIndex = 0;

  const handleScriptLoad = () => {
    setIsScriptLoaded(true);
  };

  function showFieldset(index) {
    console.log(currentIndex);
    fieldsets[currentIndex].classList.remove("active");
    fieldsets[index].classList.add("active");
    fieldsets[index].classList.show();
    currentIndex = index;
  }

  function sanitizeIBAN(input) {
    const regex = /^[A-Za-z]{2}\d{19,32}$/; //regex pattern for validating input
    const sanitizedInput = input.toUpperCase(); //convert all lowercase to uppercase
    if (regex.test(sanitizedInput)) {
      return true;
    } else {
      return false;
    }
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
    input = input.replace(/\D/g, "");

    // Add decimal comma when input is longer than 2 digits
    if (input.length > 2) {
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
    hideCanvas();
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

    // De-activate current step on progressbar
    const progressbarLis = document.querySelectorAll("#progressbar li");
    const currentIndex = Array.from(document.querySelectorAll("fieldset")).indexOf(current_fs);
    progressbarLis[currentIndex].classList.remove("active");
  };

  const inputStyle = (element) => {
    border: element ? "1px solid green" : "1px solid red";
  };

  const handleIBAN = (event) => {
    let input = event.target.value;
    let valid = sanitizeIBAN(input);
    if (valid) {
      setIsInputValid(true);
    } else {
      setIsInputValid(false);
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

  const generateBarcode = async () => {
    const name_s = document.getElementById("name_s").value.trim().toUpperCase();
    const address_s = document.getElementById("address_s").value.trim().toUpperCase();
    const zip_s = document.getElementById("zip_s").value.trim().toUpperCase();
    const city_s = document.getElementById("city_s").value.trim().toUpperCase();
    const name_r = document.getElementById("name_r").value.trim().toUpperCase();
    const address_r = document.getElementById("address_r").value.trim().toUpperCase();
    const zip_r = document.getElementById("zip_r").value.trim().toUpperCase().match(/\d/g).join("");
    const city_r = document.getElementById("city_r").value.trim().toUpperCase();
    let value = document.getElementById("value").value.trim().toUpperCase();
    const currency = document.getElementById("currency").value.trim().toUpperCase() || "EUR";
    const iban = document.getElementById("iban").value.trim().toUpperCase();
    const code = document.getElementById("code").value.trim().toUpperCase() || "COST";
    const model = document.getElementById("model").value.trim().toUpperCase() || "HR00";
    const c2n = document.getElementById("c2n").value.trim().toUpperCase();
    const desc = document.getElementById("desc").value.trim().toUpperCase();

    value = value.replace(/\D/g, "");
    let s = "00000000000000" + value;
    value = s.slice(s.length - 15);

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
      desc +
      "\n";

    if (canvas && name_r && address_r && zip_r && city_r && value && currency && iban && code && desc) {
      PDF417.draw(barcode, canvas, 2.667, 6, 2);
      console.log(barcode);
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
          <input id="name_s" type="text" name="name_s" placeholder="Ime i prezime" onChange={hideCanvas} />
          <input id="address_s" type="text" name="adress_s" placeholder="Adresa" onChange={hideCanvas} />
          <div className="side-by-side">
            <input id="zip_s" className="zip" type="text" name="zip_s" placeholder="Po. br." onChange={hideCanvas} />
            <input id="city_s" type="text" name="city_s" placeholder="Grad" onChange={hideCanvas} />
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
            onChange={hideCanvas}
            required
            pattern="^[^<>%$]+$"
          />
          <input
            id="address_r"
            type="text"
            name="adress_r"
            placeholder="Adresa"
            onChange={hideCanvas}
            required
            pattern="^[^<>%$]+$"
          />
          <div className="side-by-side">
            <input
              id="zip_r"
              className="zip"
              type="text"
              name="zip_r"
              placeholder="Po. br."
              onChange={hideCanvas}
              required
              pattern="^[0-9]{5}$"
            />
            <input
              id="city_r"
              type="text"
              name="city_r"
              placeholder="Grad"
              onChange={hideCanvas}
              required
              pattern="^[^<>%$]+$"
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
              onChange={handleChange}
              required
              pattern="^[0-9\.\,]+$"
            />
            <input
              id="currency"
              type="text"
              name="currency"
              defaultValue="EUR"
              placeholder="Valuta"
              onChange={hideCanvas}
              required
              pattern="^([eE][uU][rR])|([hH][rR][kK])$"
            />
          </div>
          <div className="side-by-side">
            <input
              id="iban"
              type="text"
              name="IBAN"
              placeholder="IBAN"
              style={inputStyle("isIBANValid")}
              onChange={handleIBAN}
              required
              pattern="^([hH][rR])([0-9]{19})$"
            />
            <input
              id="code"
              type="text"
              name="code"
              placeholder="Šifra"
              defaultValue={selectedKey || "COST"}
              onChange={hideCanvas}
              pattern="^[a-zA-Z]{4}$"
            />
          </div>
          <div className="side-by-side">
            <input
              id="model"
              type="text"
              name="model"
              defaultValue="HR00"
              placeholder="Model"
              onChange={hideCanvas}
              pattern="^([hH][rR])([0-9]{2})$"
            />
            <input
              id="c2n"
              type="text"
              name="c2n"
              placeholder="Poziv na broj"
              onChange={hideCanvas}
              pattern="^([0-9\-\s]+)$"
            />
          </div>
          <textarea
            id="desc"
            name="desc"
            placeholder="Opis plaćanja"
            onChange={hideCanvas}
            required
            pattern="^[^<>%$]+$"
          ></textarea>
          <input
            type="button"
            name="previous"
            className="previous action-button"
            value="Natrag"
            onClick={handlePrevious}
          />
          <a className="submit action-button" target="_top" onClick={generateBarcode}>
            GENERIRAJ
          </a>
        </fieldset>
      </form>
      <canvas ref={error_canvas} id="barcode"></canvas>
    </div>
  );
}

export default App;
