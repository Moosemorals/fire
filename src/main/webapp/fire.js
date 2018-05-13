const ranges = {
    ff: [0, 1, 0.01],
    sat: [0, 100, 1],
    lum: [0, 100, 1]
}

const state = {
    animating: false,
    scale: 4,
    ff: 0.65,
    sat: 100,
    lum: 100
};

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
    setState("animating", true);
    animate()
};
/** Stop the animation
 * 
 */
const stop = () => setState("animating", false);

const fireFactor = () => 9 + getState("ff");
const rows = () => 200 / getState("scale");
const cols = () => 200 / getState("scale");

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

/** Create the controls needed for the display, and add them to the DOM
 * buildDisplay:: () -> Element
 * 
 */
const buildDisplay = () => appendChildren($("#fire")[0],
    buildRangeControl("ff", "Fire Factor"),
    buildRangeControl("sat", "Saturation"),
    buildRangeControl("lum", "Luminosity"),
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
const clampWidth = x => clamp(0, cols() - 1, x);

/** {@link clamp} an number to the height of the grid
 * 
 *  clampHeight:: Number -> Number
 */
const clampHeight = y => clamp(0, rows() - 1, y);

/** Holds a pair of numbers and tools to map from
 * a 1D array to/from a 2D grid.
 * @class
 */
class Pair {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /** Converts this Pair to an index 
     * 
     * index:: () -> Number
     * @return {Number}
     */
    get index() {
        return (cols() * this.y) + this.x;
    }

    /** Gets a Pair pointing to the cell at (offX, offY) 
     * relative to this one. Out of bounds access is clamped
     * to the edge of the grid
     * 
     * neigbour:: (Number, Number) -> Pair
     * 
     * @param {Number} offX - Offset in x
     * @param {Number} offY - Offset in y
     * @return {Pair}
     */
    neighbour(offX, offY) {
        return new Pair(clampWidth(this.x + offX), clampHeight(this.y + offY));
    }

    /** Creates a new pair based on the given index. No overflow checking is done
     * 
     * fromIndex:: Number -> Pair
     * 
     */
    static fromIndex(index) {
        return new Pair(index % cols(), intDiv(index, cols()));
    }
}

/** Gets the gridwise neighbor of a point in a 1D array
 * 
 * neighbour:: (Number, Number, Number) => Number
 */
const neighbour = (index, x, y) => Pair.fromIndex(index).neighbour(x, y).index;


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
const filterLine = (row, index) => Pair.fromIndex(index).y === row;

/** Calculates if a given 1D index is in the final row of the grid
 * 
 * filterLast:: (Number) -> Boolean
 * 
 * @param {Number} index 
 * @return {Boolean} - true if the index is in the last row, false otherwise
 */
const filterLast = index => filterLine(rows() - 1, index);

/** If the value given isn't in the last row, calcualte the average value of its neighbourghs
 * 
 * mutate:: (Number, Number, [Number]) => Number 
 * 
 * @param {Number} x - Current value
 * @param {Number} index 
 * @param {Number[]} xs - Current array
 * @return {Number} - x for the last row, or averaged neighbours
 */
const mutate = (x, index, xs) =>
    filterLast(index) ? x :
    neighbourhood(index)
    .map(n => xs[n])
    .reduce((acc, v) => acc + v, 0) / fireFactor()

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

// initArray:: Number -> [a]

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
const makeColor = (h, s, l) => "hsl(" + h + ", " + s + "%, " + l + "%)";

let fire = initArray(rows() * cols()).map(randomLast);

let reds = createArray(256, () => []);
const g = getContext();

function animate() {
    reds.forEach(x => x.length = 0);
    const f2 = fire.map(mutate);

    f2.forEach((x, index) => {
        if (filterLast(index)) {
            return;
        }
        const p = Pair.fromIndex(index);
        const red = Math.floor(x * 255);

        try {
            reds[red].push(p);
        } catch (ex) {
            console.log(red, p);
            throw ex;
        }
    })

    const scale = getState("scale");
    reds.forEach((x, red) => {
        if (x.length > 0) {
            setStyle(g, makeColor(
                (red / 255) * 70,
                getState("sat"),
                red / 255 * getState("lum"),
            ));
            x.forEach(p => drawRect(g, p.x * scale, p.y * scale, scale, scale));
        }
    })

    fire = f2.map(randomLast);
    if (getState("animating")) {
        window.requestAnimationFrame(animate);
    }
}


document.addEventListener("DOMContentLoaded", buildDisplay);