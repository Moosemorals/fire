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

        const prop = (obj, key) => obj !== undefined && key in obj ? obj[key] : undefined;

        const getState = key => prop(state, key);
        const setState = (k, v) => state[k] = v;

        const start = () => { setState("animating", true); animate() };
        const stop = () => setState("animating", false);

        const fireFactor = () => 9 + getState("ff");
        const rows = () => 200 / getState("scale");
        const cols = () => 200 / getState("scale");

        // toArray:: arrayLike of a -> [a]
        const toArray = x => Array.prototype.slice.call(x);

        const isDefined = x => x !== undefined && x !== null;

        // $:: String -> [Element]
        const $ = x => toArray(document.querySelectorAll(x));

        // buildElement:: (String, object) -> Element
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

        const on = (event, el, fn) => {
            el.addEventListener(event, fn);
            return el;
        }

        const onClick = (el, fn) => on("click", el, fn);
        const onChange = (el, fn) => on("change", el, fn);

        const buildButton = (id, text, onclick) => appendChildren(
            onClick(buildElement("button", { type: "button", id: id }), onclick),
            text
        )

        // buildRange :: (Number, Number, Number, String) -> Element
        const buildRange = (min, max, step, value, id) => buildElement("input", {
            type: "range",
            min: min,
            max: max,
            step: step,
            value: value,
            id: id
        })

        const nodify = x => {
            switch (typeof x) {
                case "string":
                case "number":
                    return document.createTextNode(x);
                default:
                    return x;
            }
        }

        const safeAppend = (el, node) => el.appendChild(nodify(node));

        const appendChildren = (el, ...children) => {
            children.filter(isDefined)
                .forEach(c => safeAppend(el, c));
            return el;
        }

        const onRangeChanged = (tracks) => e => setState(tracks, parseFloat(e.target.value));

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

        const buildDisplay = () => appendChildren($("#fire")[0],
            buildRangeControl("ff", "Fire Factor"),
            buildRangeControl("sat", "Saturation"),
            buildRangeControl("lum", "Luminosity"),
            buildButton("start", "Start", start),
            buildButton("stop", "Stop", stop)
        )
        // intDiv:: (x, y) -> Number
        const intDiv = (x, y) => Math.floor(x / y);

        // clamp:: (Number, Number, Number) -> Number
        const clamp = (min, max, x) => (x < min) ? min : (x > max) ? max : x;

        // clampWidth:: Number -> Number
        const clampWidth = x => clamp(0, cols() - 1, x);

        // clampHeight:: Number -> Number
        const clampHeight = y => clamp(0, rows() - 1, y);

        class Pair {
            constructor(x, y) {
                this.x = x;
                this.y = y;
            }

            get index() {
                return (cols() * this.y) + this.x;
            }

            neighbour(offX, offY) {
                return new Pair(clampWidth(this.x + offX), clampHeight(this.y + offY));
            }

            static fromIndex(index) {
                return new Pair(index % cols(), intDiv(index, cols()));
            }
        }

        // neighbour:: (Number, Number, Number) => Number
        const neighbour = (index, x, y) => Pair.fromIndex(index).neighbour(x, y).index;

        // neighborhoood: Number => [Number]
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

        const filterLine = (row, index) => Pair.fromIndex(index).y === row;
        const filterLast = index => filterLine(rows() - 1, index);

        // mutate:: (Number, Number, [Number]) => Number
        const mutate = (x, index, xs) =>
            filterLast(index) ? x :
                neighbourhood(index)
                    .map(n => xs[n])
                    .reduce((acc, v) => acc + v, 0) / fireFactor()

        // createArray:: (Number, () -> a) -> [a]
        const createArray = (x, fn) => Array(x).fill().map(fn);

        const setLast = (fn, x, index) => filterLast(index) ? fn() : x;

        const randomLast = (x, index) => setLast(Math.random, x, index);
        const fixedLast = (x, index) => setLast(() => 1, x, index);

        // initArray:: Number -> [a]
        const initArray = x => createArray(x, () => 0);

        const getContext = () => $("canvas")[0].getContext("2d");
        const setStyle = (c, s) => c.fillStyle = s;
        const drawRect = (c, x, y, w, h) => c.fillRect(x, y, w, h);
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

