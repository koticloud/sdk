<script>
    import { showSidebar } from './showSidebar.js';

    (() => {
        registerEvents();
    })();

    function registerEvents() {
        window.addEventListener('resize', (e) => {
            // Hide the forced sidebar on window resize
            showSidebar.set(false);
        });
    }

    function hideSidebar() {
        showSidebar.set(false);
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

.sidebar .nav-group {
    list-style: none;
    padding: .5rem 0;

    li {
        display: flex;
        cursor: pointer;
        color: #cacaca;
        text-shadow: 0 0 1px #000;
        
        &:hover, &.active {
            background-color: $navActiveBg;
        }

        a {
            width: 100%;
            padding: .75rem 0;
            padding-left: 2rem;
            padding-right: 1rem;
            text-decoration: none;
            color: inherit;
            display: flex;
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
}
</style>

<div class="sidebar-container"
    class:force-show={$showSidebar}
    on:click|self={hideSidebar}
>
    <div class="sidebar kc--noselect">
        <!-- TODO: DEBUG -->
        <p>SidebarMenu!!1</p>

        <p>Show: { $showSidebar }</p>
        <!-- TODO: DEBUG -->

        <!-- <ul class="nav-group">
            <li title="All Notes"
                :class="{ 'active': isCategory('all') }"
            >
                <router-link :to="{
                    name: 'notes.category',
                    params: { category: 'all' }
                }">
                    <div class="icon">
                        <i class="far fa-copy"></i>
                    </div>

                    <div class="title">All Notes</div>
                </router-link>
            </li>

            <li title="Trash"
                :class="{ 'active': isCategory('trash') }"
            >
                <router-link :to="{
                    name: 'notes.category',
                    params: { category: 'trash' }
                }">
                    <div class="icon">
                        <i class="far fa-trash-alt"></i>
                    </div>

                    <div class="title">Trash</div>
                </router-link>
            </li>

            <li title="Manage Tags"
                :class="{ 'active': isCategory('tags') }"
            >
                <router-link :to="{
                    name: 'tags',
                }">
                    <div class="icon">
                        <i class="fas fa-tags"></i>
                    </div>

                    <div class="title">Manage Tags</div>
                </router-link>
            </li>
        </ul>
        
        <hr v-show="tagList.length" class="nav-separator">

        <ul v-show="tagList.length" class="nav-group">
            <li v-for="(tag, index) in tagList"
                :key="index"
                :title="tag.tag"
                :class="{ 'active': isCategory(`tag-${tag.slug}`) }"
            >
                <router-link :to="{
                    name: 'notes.category',
                    params: { category: `tag-${tag.slug}` }
                }">
                    <div class="icon">
                        <i class="fas fa-tag"></i>
                    </div>

                    <div class="title" v-text="tag.tag"></div>
                </router-link>
            </li>
        </ul> -->
    </div>
</div>