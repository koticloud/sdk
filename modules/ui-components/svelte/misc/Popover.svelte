<script>
    export let className = '';
</script>

<style lang="scss">
.popover {
    position: absolute;
    z-index: 2;
}
</style>

<div class="popover {className}">
    <slot></slot>
</div>