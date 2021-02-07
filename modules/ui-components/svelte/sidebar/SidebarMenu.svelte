<script>
    import { showSidebar } from './showSidebar.js';
    import Navigator from '../../../Navigator.js';

    // Props
    export let menu = {};
    
    // State
    let activeItem = null;

    (() => {
        registerEvents();
    })();

    function registerEvents() {
        window.addEventListener('resize', (e) => {
            // Hide the forced sidebar on window resize
            showSidebar.set(false);
        });

        Navigator.afterEnteringEach(async (from, to) => {
            // After navigating to a page - change active item if any of the
            // menu items correspond to that page
            const itemName = findItemNameForPage(to);

            if (itemName) {
                activeItem = itemName;
            }
        });
    }

    function findItemNameForPage(page) {
        for (let navGroup in menu) {
            if (!menu[navGroup].items || !Object.keys(menu[navGroup]).length) {
                return null;
            }

            for (let itemName in menu[navGroup].items) {
                const item = menu[navGroup].items[itemName];

                if (!item.page) {
                    return null;
                }

                if (item.page.name && item.page.name === page.name && pageHasParams(page, item.page.params)) {
                    return itemName;
                }
            }
        }

        function pageHasParams(page, params) {
            if (!params) {
                return true;
            }

            if (page.params === undefined) {
                return false;
            }

            for (let field in params) {
                if (page.params[field] !== params[field]) {
                    return false;
                }
            }

            return true;
        }

        return null;
    }

    function hideSidebar() {
        showSidebar.set(false);
    }

    function onItemClick(_item, _itemName) {
        if (_item.page) {
            if (!_item.page.name) {
                return;
            }

            const pageParams = _item.page.params ? _item.page.params : {};

            Navigator.goTo(_item.page.name, pageParams);

            activeItem = _itemName;
        } else if (_item.handler) {
            _item.handler();
        }

        hideSidebar();
    }
</script>

<style lang="scss">
$bigScreenWidth: 1150px;
$navActiveBg: #414747;

.sidebar-container {
    height: 100%;
    z-index: 100;
    background: #000000aa;

    display: none;

    &.force-show {
        width: 100%;
        display: block;
        position: absolute;
    }

    @media (min-width: $bigScreenWidth) {
        display: block;

        &.force-show {
            position: relative;
            width: auto;
        }
    }
}

.sidebar {
    min-width: 10rem;
    max-width: 20rem;
    height: 100%;
    background-color: #2f3235;
    color: #ffffff;

    z-index: 2;
    overflow: hidden;
    overflow-y: auto;
}

.sidebar .group-title {
    color: #fafafa;
    text-shadow: 0 0 1px #000;
    padding: .75rem 0;
    text-align: center;
    text-transform: uppercase;
    // TODO: See if more styling needed
}

.sidebar .nav-group {
    list-style: none;
    padding: .5rem 0;

    li {
        display: flex;
        width: 100%;
        cursor: pointer;
        color: #cacaca;
        padding: .75rem 0;
        padding-left: 2rem;
        padding-right: 1rem;
        
        &:hover, &.active {
            background-color: $navActiveBg;
        }
    }

    li .icon {
        min-width: 2rem;
        color: #808080;
    }

    li .title {
        font-size: .9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    li.active {
        position: relative;
        color: #fafafa;

        .icon {
            color: #dddddd;
        }

        &::before, &::after {
            position: absolute;
            display: block;
            content: "";
            border: .4rem solid transparent;
        }

        &::before {
            left: .3rem;
            top: calc(50% - .4rem);
            border-left-color: #8d8d8d;
        }

        &::after {
            left: .2rem;
            top: calc(50% - .4rem);
            border-left-color: $navActiveBg;
        }
    }
}

.sidebar .nav-separator {
    border: 1px solid $navActiveBg;
    margin: .5rem 0;

    &:last-of-type {
        display: none;
    }
}
</style>

<div class="sidebar-container"
    class:force-show={$showSidebar}
    on:click|self={hideSidebar}
>
    <div class="sidebar kc--noselect">
        {#each Object.keys(menu) as navGroup}
            {#if menu[navGroup].title}
                <div class="group-title">{navGroup}</div>
            {/if}

            {#if menu[navGroup].items && Object.keys(menu[navGroup].items).length}
                <ul class="nav-group">
                    {#each Object.keys(menu[navGroup].items) as itemName}
                        <li title={menu[navGroup].items[itemName].title ? menu[navGroup].items[itemName].title : ''}
                            class:active={ activeItem === itemName }
                            on:click={() => onItemClick(menu[navGroup].items[itemName], itemName)}
                        >
                            <div class="icon">
                                {@html menu[navGroup].items[itemName].icon}
                            </div>

                            <div class="title">
                                {menu[navGroup].items[itemName].title}
                            </div>
                        </li>
                    {/each}
                </ul>

                <hr class="nav-separator">
            {/if}
        {/each}
    </div>
</div>