<script>
    export let defaultStyle = true;
</script>

<style lang="scss">
.kc-component--panel.kc-component--default-style {
    background: var(--kc-color--bg-secondary);
    color: var(--kc-color--text-main);
    min-height: 2.5rem;

    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;

    .left, .right {
        white-space: nowrap;
    }

    .middle {
        text-align: center;
        margin: 0 1rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .right {
        text-align: right;
    }
}
</style>

<div class="kc-component--panel" class:kc-component--default-style={defaultStyle}>
    <div class="left">
        <slot name="left"></slot>
    </div>

    <div class="middle">
        <slot></slot>
    </div>

    <div class="right">
        <slot name="right"></slot>
    </div>
</div>