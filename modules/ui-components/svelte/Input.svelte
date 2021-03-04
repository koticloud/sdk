<script>
    export let label = '';
    export let placeholder = '';
    export let tip = '';
    export let value = null;
</script>

<style lang="scss">
.kc-component--input {
    background: var(--kc-color--bg-secondary);
    color: var(--kc-color--text-secondary);
    padding: .75rem 1.25rem;
    transition: background .15s ease;

    &:hover {
        background: var(--kc-color--bg-secondary-hover);
    }

    .input {
        display: flex;
        align-items: center;
        
        .label {
            text-align: left;
            padding-right: 1rem;
        }

        .value {
            flex: 1;
        }

        .value input {
            width: 100%;
            font-family: inherit;
            color: var(--kc-color--text-main);
            margin: 0;
            padding: .5rem;

            background: var(--kc-color--bg-main);
            border: none;
            border: 1px solid var(--kc-color--bg-secondary);

            &:focus, &:active {
                border-color: var(--kc-color--bg-accent);
            }
        }
    }

    .messages p {
        margin-top: .25rem;
        font-style: italic;
        font-size: .8rem;
        text-align: right;
        color: var(--kc-color--text-secondary);

        &.error {
            color: var(--kc-color--danger-red);
        }
    }
}
</style>


<div class="kc-component--input">
    <div class="input">
        <div class="label">{ label }</div>
        
        <div class="value">
            <input type="text"
                bind:value={value}
                placeholder={placeholder}>
        </div>
    </div>

    <div class="messages">
        {#if tip}
            <p class="tip">{ tip }</p>
        {/if}

        <!-- <p class="error">The field is requried!</p> -->
    </div>
</div>