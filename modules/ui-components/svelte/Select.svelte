<script>
    import App from "../../App";

    export let text = '';
    export let options = {};
    export let value = null;

    function showSelect() {
        const selectOptions = {
            title: text,
            selected: value,
            options: options,
        };

        App._instance.ui.select(selectOptions, text)
            .then(_value => {
                value = _value;
            })
            // Ignore cancel/error
            .catch(err => {});
    }
</script>

<style lang="scss">
.kc-component--select {
    background: var(--kc-color--bg-secondary);
    color: var(--kc-color--text-secondary);
    padding: .75rem 1.25rem;
    transition: background .15s ease;
    cursor: pointer;
    display: flex;

    &:hover {
        background: var(--kc-color--bg-secondary-hover); 
    }

    &:active {
        background: var(--kc-color--bg-accent);
        color: var(--kc-color--text-accent);
        
        .value {
            color: var(--kc-color--text-accent);
        }
    }

    .text {
        flex: 1;
        text-align: left;
        padding-right: 1rem;
    }

    .value {
        color: var(--kc-color--text-main);
    }

    .caret {
        margin-left: .5rem;
    }
}
</style>

<slot>
    <div class="kc-component--select" on:click={showSelect}>
        <div class="text">{ text }</div>
        
        <div class="value">
            { value && options[value] ? options[value] : '-' }
        </div>

        <div class="caret">
            <!-- &#9660; -->
            &#9662;
        </div>
    </div>
</slot>