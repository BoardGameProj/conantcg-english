export const PopoverManager = {
    isAnyPopoverOpen: false,
    openPopover: null,

    setPopoverOpen(popoverInstance) {
        this.isAnyPopoverOpen = true;
        this.openPopover = popoverInstance;
    },

    setPopoverClosed() {
        this.isAnyPopoverOpen = false;
        this.openPopover = null;
    },

    shouldAllowHover() {
        return !this.isAnyPopoverOpen;
    }
};