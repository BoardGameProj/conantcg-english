class FilterOption extends HTMLElement {
    connectedCallback() {
        const type = this.getAttribute('fieldtype') || 'text'
        const key = this.getAttribute('key')
        let content = `<input type="text" name="${key}" data-filter-key="${key}">`
        if (['checkbox', 'radio'].includes(type)) {
            // Checkbox or radio
            content = '<div class="bg-white">';
            const values = JSON.parse(this.getAttribute('values'))
            for (const value of values) {
                content += `<label>
<input type="${type}" name="${key}" value="${value}" data-filter-key="${key}" class="hidden" />
<span class="px-4 p-1 bg-white cursor-pointer" style="border: 1px solid black;">${value}</span>
</label>`;
            }
            content += `</div>`;
        }
        if (['select'].includes(type)) {
            // Select
            content = `<select name="${key}" data-filter-key="${key}">`;
            if (this.hasAttribute('noneValue')) {
                content += `<option value="">${this.getAttribute('noneValue')}</option>`
            }
            const values = JSON.parse(this.getAttribute('values'))
            for (const value of values) {
                content += `<option value="${value}">${value}</option>`;
            }
            content += `</select>`;
        }

        const fieldset = document.createElement('div')
        fieldset.className = 'flex flex-col lg:flex-row w-full mb-1'
        fieldset.innerHTML = `<legend>${this.getAttribute('title')}</legend>${content}`
        this.appendChild(fieldset)
    }
}
customElements.define('dct-filter-option', FilterOption);

function kebabize(str) {
    let result = ''; // Use a single string to build the result
    for (let i = 0; i < str.length; i++) {
        let char = str[i];
        // Check if the character is uppercase
        if (char === char.toUpperCase() && i !== 0) { // Add a dash before uppercase letters, except the first character
            result += '-';
        }
        result += char.toLowerCase(); // Add the lowercase version of the current character to the result
    }
    return result;
}

const registeredForRendering = []
document.addEventListener("DOMContentLoaded", () => {
    for (const card of registeredForRendering) {
        card.render();
    }
}, {once: true});

class Card extends HTMLElement {
    data = {
        id: '',
        type: '',
        cardNum: '',
        title: '',
        product: '',
        color: '',
        rarity: '',
        promoDetails: '',
        categories: [],
        cost: 0,
        ap: 0,
        lp: 0,
        caseDifficultyFirst: 0,
        caseDifficultySecond: 0,
        illustrator: '',
        cardText: '',
    }

    popover = null

    // The browser calls this method when the element is
    // added to the DOM.
    connectedCallback() {
        this.data.id = this.getAttribute('id')
        this.data.type = this.getAttribute('type')
        this.data.cardNum = this.getAttribute('card-num')
        this.data.title = this.getAttribute('title')
        this.data.product = this.getAttribute('product')
        this.data.color = this.getAttribute('color')
        this.data.rarity = this.getAttribute('rarity')
        this.data.categories = this.getAttribute('categories').split(',')
        this.data.cost = this.getAttribute('cost')
        this.data.ap = this.getAttribute('ap')
        this.data.lp = this.getAttribute('lp')
        this.data.image = this.getAttribute('image')
        this.data.promoDetails = this.getAttribute('promo-details')
        this.data.caseDifficultyFirst = this.getAttribute('case-difficulty-first')
        this.data.caseDifficultySecond = this.getAttribute('case-difficulty-second')
        this.data.illustrator = this.getAttribute('illustrator') || ''

        // Combine feature, hirameki, cut in into card text
        let feature = processMechanics(this.hasAttribute('feature') ? this.getAttribute('feature') : '')
        let hirameki = this.hasAttribute('hirameki') ? this.getAttribute('hirameki') : ''
        if (hirameki !== '') {
            hirameki = '<span class="text-orange-500 me-1"><i class="fa-solid">!</i> ' + createTooltip('Insight', 'During Contact, remove this card from your hand to use it.') + '</span> ' + hirameki
        }
        let cutIn = this.hasAttribute('cut-in') ? this.getAttribute('cut-in') : ''
        this.data.cardText = [feature, hirameki, cutIn].filter((s) => s !== '').join('\n\n');
        this.data.cardText = placeTooltips(processKeywords(this.data.cardText))

        // Prepare filter attributes
        const ignoreFilterAttributes = ['image']
        for (let setting of Object.keys(this.data)) {
            if (ignoreFilterAttributes.includes(setting)) {
                continue
            }
            let value = this.data[setting]
            if (['cardText', 'illustrator'].includes(setting) && ['', '-'].includes(value)) {
                value = null
            }
            if (setting === 'categories' && value !== null) {
                value = value.join(',')
            }
            if (!value) {
                continue
            }
            this.setAttribute('data-filter-' + kebabize(setting), value)
            this.removeAttribute(setting)
        }

        registeredForRendering.push(this)
    }

    render() {
        //const shadow = this.attachShadow({mode: "open"});
        const img = document.createElement('img')
        const popoverId = `card-${this.data.id}`
        img.src = this.data.image
        img.setAttribute('loading', 'lazy')
        img.classList.add('cursor-pointer', 'border', 'rounded-md')
        img.width = 160
        img.alt = `${this.data.title} (${this.data.cardNum})`
        this.appendChild(img)
        //shadow.appendChild(wrapper)

        const overlaySelector = '#DCT-Overlays #' + popoverId
        // bind click ourselves so we can close it with a button. otherwise _hideHandler messes up
        img.addEventListener('click', () => {
            this.prepareOverlays(img)
            window.dispatchEvent(new Event('resize'))
            this.popover._targetEl = document.querySelector(overlaySelector)
            this.popover._initialized = false
            this.popover.init()
            this.popover.show()
        })
    }

    prepareOverlays(img) {
        if (this.popover) {
            return
        }
        if (!document.getElementById('DCT-Overlays')) {
            const container = document.createElement('div')
            container.id = 'DCT-Overlays'
            document.body.appendChild(container)
        }
        const container = document.getElementById('DCT-Overlays')

        const labels = {
            cardNum: 'Card ID',
            type: 'Card Category',
            cardText: 'Effect',
            product: 'Product',
            promoDetails: 'Distribution',
            color: 'Color',
            rarity: 'Rarity',
            categories: 'Categories',
            cost: 'Cost',
            ap: 'AP',
            lp: 'LP',
            illustrator: 'Illustrator',
            caseDifficultyFirst: 'Case Difficulty (going first)',
            caseDifficultySecond: 'Case Difficulty (going second)'
        }

        const fields = ['cardNum', 'type', 'cardText']
        if (this.data.rarity === 'PR') {
            fields.push('promoDetails')
        } else {
            fields.push('product')
        }
        fields.push('color')
        fields.push('rarity')
        if (this.data.type === 'Character') {
            fields.push('categories')
        }
        if (this.data.type === 'Character' || this.data.type === 'Event') {
            fields.push('cost')
        }
        if (this.data.type === 'Character') {
            fields.push('ap')
        }
        if (this.data.type === 'Character' || this.data.type === 'Partner') {
            fields.push('lp')
        }
        if (this.data.type === 'Case') {
            fields.push('caseDifficultyFirst')
            fields.push('caseDifficultySecond')
        }
        if (this.data.illustrator.length) {
            fields.push('illustrator')
        }

        let content = ''
        for (const key of fields) {
            let value = this.data[key]
            if (Array.isArray(value)) {
                // Array values: keep words on one line, and join with comma
                value = value.map(v => v.replaceAll(' ', '&nbsp;')).join(', ')
            }
            if (key === 'cardText') {
                value = value.replaceAll('\n', '<br>')
                if (value === '') {
                    value = '–'
                }
            }
            content += `<div class="flex justify-between lg:py-0">
                    <div class="text-start font-bold">${labels[key]}</div>
                    <div class="text-end ms-4 card_details--${key} text-right">${value}</div>
                </div>`;
        }

        container.innerHTML += `<div data-popover id="card-${this.data.id}" role="tooltip"
     class="absolute z-10 invisible inline-block text-sm transition-opacity duration-300 border border-gray-200 rounded-lg shadow-lg opacity-0 dark:border-gray-600 bg-white dark:bg-warmgray-800 dark:text-white"
>
    <div class="flex items-start">
        <div class="cardoverlay-image self-stretch">
            <img src="${this.data.image}" alt="${this.data.title} (${this.data.cardNum})" class="rounded-xl" style="max-width: unset;" loading="lazy" />
        </div>
        <!-- Add color here as well for mobile view -->
        <div class="dark:border-gray-600 bg-white dark:bg-warmgray-800 dark:text-white" style="min-width: 550px;max-width: 550px;">
            <div class="px-2 py-2 border-b rounded-t-lg border-gray-600 bg-gray-ß00 flex justify-between text-2xl lg:text-lg" class="dct-title">
                <h3 class="font-semibold text-gray-900 dark:text-white">${this.data.title}</h3>
                <button onclick="FlowbiteInstances.getInstance('Popover', 'card-${this.data.id}').hide()" class="font-bold text-red-700 text-2xl">❌</button>
            </div>
            <div class="px-2 py-2 text-lg lg:text-base">
                ${content}
            </div>
        </div>
    </div>
    <div data-popper-arrow></div>
</div>`
        this.popover = new Popover(
            document.querySelector(`#DCT-Overlays #card-${this.data.id}`),
            img,
            {
                placement: 'auto',
                triggerType: 'none',
                onShow: () => {
                    document.querySelector('body').classList.add('dct-card-shown')
                },
                onHide: () => {
                    document.querySelector('body').classList.remove('dct-card-shown')
                }
            }
        )
    }
}

// Register the CurrentDate component using the tag name <current-date>.
customElements.define('dct-card', Card);
