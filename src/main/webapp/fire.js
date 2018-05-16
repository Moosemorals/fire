/** Get a value from an object without thowing a NPE
 * prop:: (Object, String) -> a
 * 
 * @param {Object} obj
 * @param {String} key
 * @return {*}
 */
const prop = (obj, key) => obj !== undefined && key in obj ? obj[key] : undefined;

/** Get the current value from state
 * getState:: String -> a
 * 
 * @param {String} key 
 */
const getState = key => prop(state, key);

const ranges = {
    ff: [0, 1, 0.01],
    sat: [0, 100, 1],
    lum: [0, 100, 1]
}

const state = {
    animating: false,
    scale: 10,
    ff: 0.25,
    sat: 100,
    lum: 100
};

const fireFactor = 9 + getState("ff");
const rows = 60;
const cols = 30;


const animators = {}
/** Set a state value
 * 
 * setState:: (String, a) -> undefined
 * 
 * @param {String} k - name of the state value
 * @param {*} v - new value
 */
const setState = (k, v) => state[k] = v;

/** Start the animation
 */
const start = () => {
    stop();
    requestAnimationFrame(() => {
        setState("animating", true);
        animators[getChecked('which')]()()
    })
};
/** Stop the animation
 * 
 */
const stop = () => setState("animating", false);
/** Convert something 'array like' to an actual array
 * 
 * toArray:: ArrayLike a -> [a]
 * 
 * @param {ArrayLike} x - Something with a 'length' property
 * @returns {*[]}
 */
const toArray = x => Array.prototype.slice.call(x);

/** Checks if a value is defined
 * 
 * sDefined a -> Boolean
 * 
 * @param {*}
 * @return {Boolean}
 */
const isDefined = x => x !== undefined && x !== null;

/** Get elements that match the selector from the dom 
 * 
 * $:: String -> [Element]
 * 
 * @param {String} $ - A valid CSS selector
 * @return {Element[]} - zero or more maching elements
 */
const $ = x => toArray(document.querySelectorAll(x));

/** Create a new DOM element
 * 
 * buildElement:: (String, Object) -> Element
 * 
 * @param {String} tag - Name of the element
 * @param {Object} options - Attribute name/Attribute value pairs
 *                  to be added to the element
 * @return {Element} - Newly created element
 */
const buildElement = (tag, options) => {
    const el = document.createElement(tag);
    if (options !== null) {
        for (let key in options) {
            if (options[key] !== undefined) {
                el.setAttribute(key, options[key]);
            }
        }
    }
    return el;
}

/** Add an event listener to an elemnet
 * 
 * on:: (String, Element, (Event)) -> Element
 * 
 * @param {String} event - Event type
 * @param {Element} el - Target element
 * @param {Function} fn - Event callback
 * @return {Element} - the original element (for chaining)
 */
const on = (event, el, fn) => {
    el.addEventListener(event, fn);
    return el;
}

/** Add an on click listener to an Element
 * 
 * onClick:: (Element, (Event)) -> Element
 * 
 * @param {Element} el -Target element
 * @param {Function} fn - Event callback 
 * @return {Element} - the original element (for chaining)
 */
const onClick = (el, fn) => on("click", el, fn);

/** Add an on change listener to an Element
 * 
 * onClick:: (Element, (Event)) -> Element
 * 
 * @param {Element} el -Target element
 * @param {Function} fn - Event callback 
 * @return {Element} - the original element (for chaining)
 */
const onChange = (el, fn) => on("change", el, fn);

/** Construct a DOM Button
 * 
 * buildButton:: (String, String, (Event)) -> Element
 * 
 * @param {String} id - The id of the button
 * @param {String|Element} text - The content of the button
 * @param {onclick} - A function to call when the button is clicked
 * @return {Element} - the newly created button
 */
const buildButton = (id, text, onclick) => appendChildren(
    onClick(buildElement("button", {
        type: "button",
        id: id
    }), onclick),
    text
)

/** Construct a DOM input type=range
 * 
 * buildRange :: (Number, Number, Number, Number, String) -> Element
 * 
 * @param {Number} min
 * @param {Number} max
 * @param {Number} step
 * @param {Number} value
 * @param {String} id
 * @return {Element} - The new range input
 */
// 
const buildRange = (min, max, step, value, id) => buildElement("input", {
    type: "range",
    min: min,
    max: max,
    step: step,
    value: value,
    id: id
})

/** Change a string into a DOM text node
 * 
 * textNode:: String -> Node
 * 
 * @param {String}
 * @return {Node}
 */
const textNode = x => document.createTextNode(x);

/** Checks if the arg needs to be wrapped in a DOM textNode
 * 
 * nodify a -> Node
 * 
 * @param {*} x
 * @return {Element}
 */
const nodify = x => {
    switch (typeof x) {
        case "string":
        case "number":
        case "boolean":
            return textNode(x);
        default:
            if (x instanceof Node) {
                return x;
            } else if ("toString" in x) {
                return textNode(x.toString());
            } else {
                try {
                    return JSON.stringify(x);
                } catch (ex) {
                    console.log("Can't convert value to node", x);
                    return textNode("");
                }
            }
    }
}

/** Appends a value to an element, wrapping in a text node if needed
 * 
 * safeAppend:: (Element, a) -> Element
 * 
 * @param {Element} el - Target element
 * @param {String|Number|Element} - Value to append
 * @return {Elemnet} - Modified target element
 */
const safeAppend = (el, x) => el.appendChild(nodify(x));

/** Appends a list of children to an element, skipping undefineds
 * 
 * appendChildren:: (Element, [a]) -> Element
 * 
 * @param {Element} el - Target element
 * @param {...*} children
 * @return {Element} - modified target
 */
const appendChildren = (el, ...children) => {
    children.filter(isDefined)
        .forEach(c => safeAppend(el, c));
    return el;
}

/** Update a state variable from an Event
 * 
 * onRangeChanged:: (String) -> (Event)
 * 
 * @param {String} tracks - Name of the state variable
 * @return {Function} - Fuction that extracts the current value of the input
 *          Element and stores it in state
 */
const onRangeChanged = (tracks) => e => setState(tracks, parseFloat(e.target.value));

/** Create a range control and label that tracks a state variable
 * 
 * buildRangeControl:: (String, String) -> Element
 * 
 * @param {String} tracks - Name of the state variable
 * @param {String} name - Dispaly name for the label
 * @return {Element}
 */
const buildRangeControl = (tracks, name) => {
    const control = buildRange(...ranges[tracks], getState(tracks), tracks);
    return appendChildren(
        onChange(buildElement("label", {
            for: control.id
        }), onRangeChanged(tracks)),
        control,
        name
    )
};

const buildRadio = (name, props) => buildElement("input", {
    type: "radio",
    name: name,
    value: props.value,
    checked: props.checked
})

const buildRadioControl = (name, props) => appendChildren(
    buildElement("label"),
    buildRadio(name, props),
    props.label
)

const buildRadioGroup = (name, onclick, props) => appendChildren(
    ...props.map(v =>
        onClick(buildRadioControl(name, v), onclick)
    )
);

const getChecked = name => $("input[name='" + name + "']").filter(x => prop(x, 'checked'))[0].value;

/** Create the controls needed for the display, and add them to the DOM
 * buildDisplay:: () -> Element
 * 
 */
const buildDisplay = () => appendChildren($("#fire")[0],
    buildRadioGroup("which", start, [{
            label: "Hex",
            value: "hex",
            checked: true
        },
        {
            label: "One color",
            value: 'oneColor'
        }, {
            label: "Two colors",
            value: 'twoColor'
        }
    ]),
    buildButton("start", "Start", start),
    buildButton("stop", "Stop", stop)
)

/** Integer devide one number by another
 * 
 * intDiv:: (x, y) -> Number
 * 
 * @param {Number} x - Denominator
 * @param {Number} y - Numerator
 * @return {Number} - integer value of x/y
 */
const intDiv = (x, y) => Math.floor(x / y);

/** Clamp a number to a range. min must be less than max.
 * 
 * clamp:: (Number, Number, Number) -> Number
 * 
 * @param {Number} min - Lower bound for the range
 * @param {Number} max - Upper bound for the range
 * @param {Number} x - Value to check
 */
const clamp = (min, max, x) => (x < min) ? min : (x > max) ? max : x;

/** {@link clamp} an number to the width of the grid
 * 
 *  clampWidth:: Number -> Number
 */
const clampWidth = x => clamp(0, cols - 1, x);

/** {@link clamp} an number to the height of the grid
 * 
 *  clampHeight:: Number -> Number
 */
const clampHeight = y => clamp(0, rows - 1, y);

/** Calcuates x,y from index. 
 * 
 * fromIndex:: Number -> Object 
 * 
 */
const fromIndex = (index) => ({
    x: index % cols,
    y: intDiv(index, cols)
});

/** Gets the gridwise neighbor of a point in a 1D array
 * 
 * neighbour:: (Number, Number, Number) => Number
 */
const neighbour = (index, offX, offY) => (cols * clampHeight(intDiv(index, cols) + offY)) + clampWidth(index % cols + offX);


/** Gets a list of indexes of neigbours
 * 
 * @todo Get this to take a list of (x,y) pairs
 * 
 * neighborhoood: Number => [Number]
 */
const neighbourhood = index => [
    neighbour(index, -1, 1),
    neighbour(index, 0, 1),
    neighbour(index, 1, 1),
    neighbour(index, 0, 2),
    neighbour(index, -2, 1),
    neighbour(index, -1, 2),
    neighbour(index, 2, 1),
    neighbour(index, 1, 2),
    neighbour(index, 0, 3)
];

/** Calculates if a given 1D index is in a 2D row
 * 
 * filterLine:: (Number, Number) -> Boolean
 * 
 * @param {Number} row 
 * @param {Number} index 
 * @return {Boolean} - true if the index is in the row, false otherwise
 */
const filterLine = (row, index) => fromIndex(index).y === row;

/** Calculates if a given 1D index is in the final row of the grid
 * 
 * filterLast:: (Number) -> Boolean
 * 
 * @param {Number} index 
 * @return {Boolean} - true if the index is in the last row, false otherwise
 */
const filterLast = index => filterLine(rows - 1, index);
const notLast = index => !filterLast(index);

/** If the value given isn't in the last row, calcualte the average value of its neighbourghs
 * 
 * mutate:: (Number, Number, [Number]) => Number 
 * 
 * @param {Number} x - Current value
 * @param {Number} index 
 * @param {Number[]} xs - Current array
 * @return {Number} - x for the last row, or averaged neighbours
 */
const mutate = (x, index, xs) => {
    if (filterLast(index)) {
        return x;
    } else {
        const vals = neighbourhood(index).map(n => xs[n])
        let total = 0;
        for (let i = 0; i < vals.length; i += 1) {
            total += vals[i];
        }
        return total / fireFactor;
    }
}


/** Create an array of length x, and call fn for each element
 * 
 * createArray:: (Number, () -> a) -> [a]
 * 
 * @param {Number} x - Length of new array
 * @param {Function} fn - Mutator called for each new element
 * @return {*[]} - Newly created and initilized array
 */
const createArray = (x, fn) => Array(x).fill().map(fn);

/**  Calls fn for each value in the last row of the grid
 * 
 * setLast:: (() -> Number, Number, Number) -> Number
 * 
 * @param {Function} fn 
 * @param {Number} x 
 * @param {Number} index 
 */
const setLast = (fn, x, index) => filterLast(index) ? fn() : x;


/** Sets each value of the last row of the grid to a random number
 * 
 * randomLast:: (Number, Number) -> Number
 */
const randomLast = (x, index) => setLast(Math.random, x, index);

/** Sets each value of the last row of the grid to 1 
 * 
 * randomLast:: (Number, Number) -> Number
 */
const fixedLast = (x, index) => setLast(() => 1, x, index);

const everyOddLast = (x, index) => setLast(() => index % 16 > 8 ? x : 0, x, index);
const everyEvenLast = (x, index) => setLast(() => index % 16 < 8 ? x : 0, x, index);

const middleChunk = (x, index) => setLast(() =>
 (fromIndex(index).x > cols / 4) && (fromIndex(index).x < (3 * cols / 4)) 
 ? x : 0,x, index);

/** Creates a new array of length x, filled with zeros
 * 
 * initArray:: (x) -> [0]
 * 
 * @param {Number} x - Length of the new array
 */
const initArray = x => createArray(x, () => 0);

/** Gets the Graphic Context from the DOM canvas */
const getContext = () => $("canvas")[0].getContext("2d");

/** Sets the current drawing style for the given canvas
 * 
 * setStyle:: (Canvas, String) -> ()
 * 
 * @param {Canvas}
 * @param {String}
 */
const setStyle = (c, s) => c.fillStyle = s;

/** Draw a rectangle in the canvas in the current style
 * 
 * drawRect:: (Canvas, Number, Number, Number, Number) -> ()
 * @param {Canvas}
 * @param {Number} x - Left
 * @param {Number} y - Top
 * @param {Number} width
 * @param {Number} height
 */
const drawRect = (c, x, y, w, h) => c.fillRect(x, y, w, h);

/** Build a CSS hsl() funciton
 * 
 * makeColor:: (Number, Number, Number) -> String
 * 
 * @param {Number} h - Hue from 0 to 360
 * @param {Number} s - Saturation from 0 to 100
 * @param {Number} l - Lightness from 0 to 100;
 */
const makeHsl = (h, s, l) => "hsla(" + h + ", " + s + "%, " + l + "%, 0.5)";

/** Calculate which colors go at which coridinates
 * 
 * makeReds:: (Object) -> (Number, Number) -> ()
 * 
 * @param {Object of Array} r 
 */
const makeReds = r => (x, index) => r[Math.floor(x * 255)].push(fromIndex(index))
const makeBlues = r => (x, index) => r[Math.floor(x * 255)].push(fromIndex(index))

/** Convert a 0..1 number to a redish hsv 
 * 
 * makeRed:: Number -> String
 * 
 * @param {Number} x 
 */
const makeRed = x => makeHsl(x * 70, getState("sat"), x * getState("lum"))
const makeBlue = x => makeHsl(240 - (x * 60), getState("sat"), x * getState("lum"))

const makeRGB = (r, g, b) => "rgb(" + r + "," + g + "," + b + ")";
const mergeColors = (r, b) => (_, index) => makeRGB(r[index], b[index], 0);


/** Draw a pixel on the canvas
 * 
 * drawPixel:: (Canvas, Number) -> Object -> ()
 * 
 * @param {Canvas} g - Canvas to drawn on
 * @param {Number} scale - scale factor
 */
const drawPixel = (g, scale) => p => drawRect(g, p.x * scale, p.y * scale, scale, scale);


const drawHex = (g, scale) => {
    const factor = Math.PI / 3;
    const w = 3 * scale;
    const h = Math.sqrt(3) * scale; 

    const offX = w;
    const offY = h / 2;    

    return p => {
        g.beginPath();
        for (let i = 0; i < 6; i += 1) {
            let x1 = (p.x * offX) + scale * Math.cos(factor * i)
            let y1 = (p.y * offY) + scale * Math.sin(factor * i)

            if (p.y % 2 === 0) {
                x1 += w/2;
            }

            if (i === 0) {
                g.moveTo(x1, y1)
            } else {
                g.lineTo(x1, y1)
            }
        }
        g.closePath();
        g.fill();
    }
}


/** Draws the fire on the canvas
 *
 * drawFire:: (Canvas, Number) -> (Object, Number) -> ()
 * @param {Canvas} g 
 * @param {Number} scale 
 */
const drawFire = (g, scale, maker) => (p, index) => {
    if (index > 0 && p.length > 0) {
        setStyle(g, maker(index / 255));
        p.forEach(drawPixel(g, scale));
    }
}

const hexFire = (g, scale, maker) => (p, index) => {
    if (p.length > 0) {
        setStyle(g, maker(index / 255));
     //   g.beginPath();
        p.forEach(drawHex(g, scale))
    //    g.fill();
    }
}

animators['hex'] = () => {
    const g = getContext();
    let fire = initArray(rows * cols).map(randomLast);
    const reds = createArray(256, () => []);

    return function animate() {
        if (getState("animating")) {
            window.requestAnimationFrame(animate);
        }

        // Calculate the next frame
        fire = fire
            .map(mutate)
            .map(randomLast)
            .map(middleChunk);

        // Calcuate which pixels are which color
        reds.forEach(x => x.length = 0);
        fire.map(makeReds(reds))

        // Color the pixles back in again
        reds.forEach(hexFire(g, getState("scale"), makeRed))
    }
}

animators['oneColor'] = () => {
    const g = getContext();
    let redFire = initArray(rows * cols).map(randomLast);
    const reds = createArray(256, () => []);

    return function animate() {
        if (getState("animating")) {
            window.requestAnimationFrame(animate);
        }
        // Calculate the next frame
        redFire = redFire
            .map(mutate)
            .map(randomLast)
            .map(everyOddLast);

        // Calcuate which pixels are which color
        reds.forEach(x => x.length = 0);
        redFire.map(makeReds(reds))

        // Clear the display
        setStyle(g, makeHsl(0, 0, 0));
        drawRect(g, 0, 0, 400, 400);

        // Color the pixles back in again
        reds.forEach(drawFire(g, getState("scale"), makeRed))
    }
}

animators['twoColor'] = () => {

    const g = getContext();
    let redFire = initArray(rows * cols).map(randomLast);
    let blueFire = initArray(rows * cols).map(randomLast);
    const reds = createArray(256, () => []);
    const blues = createArray(256, () => []);

    return function animate() {
        if (getState("animating")) {
            window.requestAnimationFrame(animate);
        }
        // Calculate the next frame
        redFire = redFire
            .map(mutate)
            .map(randomLast)
            .map(everyOddLast);

        blueFire = blueFire
            .map(mutate)
            .map(randomLast)
            .map(everyEvenLast)

        const pixelator = drawPixel(g, getState("scale"));
        for (let i = 0; i < redFire.length - cols; i += 1) {
            setStyle(g, makeRGB(redFire[i] * 255, blueFire[i] * 255, 0));
            pixelator(fromIndex(i))
        }
    }
}

on("DOMContentLoaded", document, buildDisplay);