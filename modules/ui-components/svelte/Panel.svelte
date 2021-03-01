<script>
    export let defaultStyle = true;
</script>

<style lang="scss">
.kc-component--panel.kc-component--default-style {
    background: var(--kc-color--bg-secondary);
    color: var(--kc-color--text-main);
    min-height: 2.5rem;

    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 1rem;
}
</style>

<div class="kc-component--panel" class:kc-component--default-style={defaultStyle}>
    <slot></slot>
</div>