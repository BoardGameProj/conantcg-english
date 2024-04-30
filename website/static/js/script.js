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
        illustrator: '',
        cardText: '',
    }

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
        this.data.illustrator = this.getAttribute('illustrator') || ''

        // Combine feature, hirameki, cut in into card text
        const feature = this.hasAttribute('feature') ? this.getAttribute('feature') : ''
        const hirameki = this.hasAttribute('hirameki') ? this.getAttribute('hirameki') : ''
        const cutIn = this.hasAttribute('cut-in') ? this.getAttribute('cut-in') : ''
        this.data.cardText = [feature, hirameki, cutIn].filter((s) => s !== '').join('\n\n');

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
            if (setting === 'cardNum') {
                setting = 'card-num'
            }
            if (setting === 'promoDetails') {
                setting = 'promo-details'
            }
            if (!value) {
                continue
            }
            this.setAttribute('data-filter-' + setting, value)
            this.removeAttribute(setting)
        }

        this.prepareOverlays()
        this.render()
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
        const popover = new Popover(
            document.querySelector(overlaySelector),
            img,
            {
                placement: this.getAttribute('popover-placement'),
                triggerType: 'none',
                onShow: () => {
                    document.querySelector('body').classList.add('dct-card-shown')
                },
                onHide: () => {
                    document.querySelector('body').classList.remove('dct-card-shown')
                }
            }
        )
        // bind click ourselves so we can close it with a button. otherwise _hideHandler messes up
        img.addEventListener('click', () => {
            popover._targetEl = document.querySelector(overlaySelector)
            popover._initialized = false
            popover.init()
            popover.show()
        })
    }

    prepareOverlays() {
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
            illustrator: 'Illustrator'
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
            content += `<div class="flex justify-between py-1 lg:py-0">
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
        <div class="dark:border-gray-600 bg-white dark:bg-warmgray-800 dark:text-white" style="min-width: 450px;max-width: 450px;">
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
    }
}

// Register the CurrentDate component using the tag name <current-date>.
customElements.define('dct-card', Card);
