window.DCTCardOverlays = {}

class Card extends HTMLElement {
    data = {
        id: '',
        type: '',
        cardNum: '',
        title: '',
        product: '',
        color: '',
        rarity: '',
        categories: [],
        cost: 0,
        ap: 0,
        lp: 0,
        illustrator: '',
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
        this.data.illustrator = this.getAttribute('illustrator') || ''
        this.data.feature = this.hasAttribute('feature') && this.getAttribute('feature').length ? this.getAttribute('feature') : '–'

        this.prepareOverlays()
        this.render()
    }

    render() {
        this.innerHTML = `<div
             data-popover-target="card-${this.data.id}"
             data-popover-trigger="click"
             data-popover-placement="${this.getAttribute('popover-placement')}"
             type="button"
             data-filter-name="${this.data.title}"
             data-filter-color="${this.data.color}"
             data-filter-product="${this.data.product}"
             data-filter-rarity="${this.data.rarity}"
             data-filter-cost="${this.data.cost}"
             data-filter-ap="${this.data.ap}"
             data-filter-lp="${this.data.lp}"
             data-filter-categories="${this.data.categories.join(',')}"
             data-filter-type="${this.data.type}"
        >
        <img src="${this.data.image}" width="160" alt="${this.data.title} (${this.data.cardNum})">
    </div>`
    }
    prepareOverlays() {
        if (!document.getElementById('DCT-Overlays')) {
            const container = document.createElement('div')
            container.id = 'DCT-Overlays'
            document.querySelector('#content').appendChild(container)
        }
        const container = document.getElementById('DCT-Overlays')
        const fields = {
            'Card ID': this.data.cardNum,
            'Card Category': this.data.type
        }
        if (this.data.type !== 'Case') {
            fields.Effect = this.data.feature
        }
        fields.Product = this.data.product
        fields.Color = this.data.color
        fields.Rarity = this.data.rarity
        if (this.data.type === 'Character') {
            fields.Categories = this.data.categories.join(', ')
        }
        if (this.data.type === 'Character' || this.data.type === 'Event') {
            fields.Cost = this.data.cost
        }
        if (this.data.type === 'Character') {
            fields.AP = this.data.ap
        }
        if (this.data.type === 'Character' || this.data.type === 'Partner') {
            fields.LP = this.data.lp
        }
        if (this.data.illustrator.length) {
            fields.Illustrator = this.data.illustrator
        }

        let content = ''
        for (const label in fields) {
            content += `<div class="flex justify-between">
                    <div class="text-start font-bold">${label}</div>
                    <div class="text-end">${fields[label]}</div>
                </div>`;
        }

        container.innerHTML += `<div data-popover id="card-${this.data.id}" role="tooltip"
     class="absolute z-10 invisible inline-block w-64 text-sm text-gray-500 transition-opacity duration-300 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800"
>
    <div class="flex">
        <img src="${this.data.image}" alt="${this.data.title} (${this.data.cardNum})" style="max-width: unset;">
        <div style="min-width: 450px;" class="bg-white dark:bg-warmgray-800 dark:text-white">
            <div class="px-2 py-2 bg-gray-100 border-b border-gray-200 rounded-t-lg dark:border-gray-600 dark:bg-gray-700 flex justify-between">
                <h3 class="font-semibold text-gray-900 dark:text-white text-lg">${this.data.title}</h3>
                <button onclick="FlowbiteInstances.getInstance('Popover', 'card-${this.data.id}').hide()">x</button>
            </div>
            <div class="px-2 py-2">
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