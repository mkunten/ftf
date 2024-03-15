<template>
  <v-form v-model="isValid" @submit.prevent="routerPush({page: 1})">
    <v-container>
      <v-row>
        <v-col cols="12" sm="2" xs="0">
        </v-col>
        <v-col cols="12" sm="8" xs="10">
          <v-text-field
            v-model="searchParam.q"
            label="text"
            placefolder="input words to search"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="2">
          <v-btn
            :loading="isLoading"
            type="submit"
            block
            class="mt-2"
            text="Search"
          ></v-btn>
        </v-col>
      </v-row>
      <v-row>
        <v-col
          cols="12"
          xs="4" sm="4"
          class="pa-0 ma-0"
          v-for="chb in elevelList"
          :key="chb"
        >
          <v-checkbox
            class="pa-0 ma-0"
            v-model="searchParam.el"
            :label="`${chb} (${recordCount[chb] || 0})`"
            :value="chb"
            density="compact"
          ></v-checkbox>
        </v-col>
      </v-row>
      <v-row>
        <v-col
          cols="12"
          class="pa-0 ma-0"
        >
          <v-chip
            class="ma-4"
            density="compact"
            v-for="bid in searchParam.bid"
            :key="bid"
          >
            bid:{{ bid }}
            <RouterLink
              v-bind:to="{
                name: 'Search',
                query: searchParam2Query<LocationQueryRaw>({
                  bid: searchParam.bid.filter((s) => s !== bid).join(','),
                }),
              }"
            >
              <v-icon color="red" icon="mdi-close-circle"></v-icon>
            </RouterLink>
          </v-chip>
        </v-col>
      </v-row>
      <v-row v-if="errmsg">
        <v-col cols="12" md="8">
          <v-card
            hover
            class="mt-2 pa-4"
            color="error"
          >
            {{ errmsg }}
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <v-container>
      <v-layout>
        <v-navigation-drawer
          permanent
          :rail="isRail"
          bottom
        >
          <v-btn
            variant="text"
            :icon="'mdi-chevron-triple-'+(isRail ? 'right' : 'left')"
            @click.stop="isRail = !isRail"
          ></v-btn>
          <v-card
            v-if="!isRail"
          >
            <v-select
              label="per page"
              v-model="searchParam.perPage"
              :items="[10, 20, 50, 100, 200]"
              item-title="value"
              variant="solo-inverted"
              @update:modelValue="routerPush({page: 1})"
            ></v-select>
          </v-card>
          <v-card
            v-if="!isRail && facets"
            hover
            class="mt-2"
          >
            <v-list
              v-for="(words, word) in (facets.keywords.words)"
              :key="word"
              density="compact"
              class="py-0 facet"
            >
              <v-list-item>
                <RouterLink
                  v-bind:to="{
                    name: 'Search',
                    query: searchParam2Query<LocationQueryRaw>({
                      q: word as string,
                    }),
                  }"
                >
                  <em :class="getColorName(words.class)">
                    {{ word }}
                  </em>
                  <v-chip
                    class="ml-4"
                    :color="getColorName(words.class)"
                  >
                    {{ words.count }}
                  </v-chip>
                </RouterLink>
                <v-list
                  v-for="(elevels, elevel) in words.elevels"
                  :key="elevel"
                  density="compact"
                  class="py-0"
                >
                  <v-list-item>
                    <RouterLink
                      v-bind:to="{
                        name: 'Search',
                        query: searchParam2Query<LocationQueryRaw>({
                          q: word as string,
                          el: elevel as string,
                        }),
                      }"
                    >
                      <v-chip
                        :color="elevelColor[elevel]"
                      >
                        {{ elevel }}
                      </v-chip>
                      <v-chip
                        class="ml-4"
                        :color="getColorName(words.class)"
                      >
                        {{ elevels.count }}
                      </v-chip>
                    </RouterLink>
                    <v-list
                      v-for="(num, id) in elevels.ids"
                      :key="id"
                      density="compact"
                      class="py-0"
                    >
                      <v-list-item>
                        <RouterLink
                          v-bind:to="{
                            name: 'Search',
                            query: searchParam2Query<LocationQueryRaw>({
                              q: word as string,
                              el: elevel as string,
                              bid: getBid(id as string),
                            }),
                          }"
                        >
                          {{ getTitle(id as string) }}
                          <v-chip
                            class="ml-4"
                            :color="getColorName(words.class)"
                          >
                            {{ num }}
                          </v-chip>
                        </RouterLink>
                      </v-list-item>
                    </v-list>
                  </v-list-item>
                </v-list>
              </v-list-item>
            </v-list>
          </v-card>
        </v-navigation-drawer>
        <v-main>
          <v-card
            v-if="total"
            variant="elevated"
            class="mb-2"
          >
            <p class="ml-4">{{ total }} 箇所見つかりました。</p>
            <v-container>
              <v-pagination
                v-model="searchParam.page"
                :length="Math.ceil(total / searchParam.perPage)"
                :total-visible="6"
                @update:modelValue="routerPush()"
              ></v-pagination>
            </v-container>
          </v-card>
          <v-data-iterator :items="matches">
            <template
              v-for="(item, idx) in matches"
              :key="idx"
            >
              <v-card
                hover
                class="mt-2"
              >
                <v-card-title class="text-body-1 font-weight-regular">
                  {{ ((searchParam.page-1)*searchParam.perPage+idx+1) }}.
                  {{ getTitle(item.id) }}
                  {{
                    item.pages[0] === item.pages[1]
                    ? (item.pages[0]+1) + '.'
                      + (
                        item.lines[0] === item.lines[1]
                        ? (item.lines[0]+1)
                        : `${item.lines[0]+1}&ndash;${item.lines[1]+1}`
                      )
                    : `${item.pages[0]+1}.${item.lines[0]+1}`
                      + `&ndash;${item.pages[1]+1}.${item.lines[1]+1}`
                  }}
                  <v-chip
                    :color="getELevelColor(item.id)"
                  >
                    {{ getELevel(item.id) }}
                  </v-chip>
                  <a
                    title="国書DBで開く"
                    target="_blank"
                    :href="getKokushoLink(item)"
                  >
                    <v-btn
                      variant="text"
                      icon="mdi-open-in-new"
                      color="red-lighten-2"
                    ></v-btn>
                  </a>
                  <span>
                    <v-overlay
                      activator="parent"
                      location-strategy="connected"
                      scroll-strategy="close"
                    >
                      <template v-slot:activator="{ props }">
                        <v-btn
                          v-bind="props"
                          variant="text"
                          icon="mdi-tooltip-image"
                          color="red-lighten-2"
                          title="画像をポップアップ"
                        ></v-btn>
                      </template>
                      <img
                        v-for="href in getRectURLs(item)"
                        :key="href"
                        :src="href"
                        class="ma-1"
                      />
                    </v-overlay>
                  </span>
                </v-card-title>
                <v-card-text>
                  <span
                    class="match"
                    v-html="convertClassName(item.text)"
                  ></span>
                </v-card-text>
              </v-card>
            </template>
          </v-data-iterator>
        </v-main>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script lang="ts" setup>
  import type { LocationQueryRaw } from 'vue-router'
  import type { TextSearchQueryString } from '@/apis/textRepository'
  import {
    ref, reactive, computed, watch, onMounted,
  } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import repository from '@/apis/repositoryFactory'

  const disp = useDisplay()
  const router = useRouter()

  // interface
  interface Data {
    filters: Filters,
    bibl: Bibl,
    match: Match[],
    page: number,
    perPage: number,
    total: number,
  }

  interface Filters {
    keyword: {
      [cls: string]: {
        [word: string]: {
          [id: string]: number
        },
      },
    },
    tag: {
      [tag: string]: number,
    }
  }

  interface Bibl {
    [id: string]: {
      bid: string,
      cid: string,
      elevel: string,
      tags: string[],
      metadata: Metadata[],
      label: string,
      attribution: string,
      license: string,
    },
  }

  interface Metadata {
    label: string,
    value: string,
  }

  interface Facet {
    keywords: FacetKeywords,
  }

  interface FacetKeywords {
    count: number,
    words: {
      [word: string]: FacetWord,
    },
  }

  interface FacetWord {
    count: number,
    elevels: {
      [elevel: string]: FacetELevel,
    },
    class: string,
    variants: {
      [variant: string]: boolean,
    },
  }

  interface FacetELevel {
    count: number,
    ids: {
      [id: string]: number,
    },
  }

  interface Match {
    id: string,
    pages: number[],
    lines: number[],
    text: string,
    bbs: BB[],
    imageIDs: string[],
  }

  interface BB {
    x: number,
    y: number,
    w: number,
    h: number,
  }

  interface RecordCount {
    [elevel: string]: number
  }

  interface TextSearchParam {
    q: string
    el: string[]
    tag: string[]
    bid: string[]
    page: number
    perPage: number
  }

  // props
  const props = defineProps<TextSearchQueryString>()

  // data
  const errmsg = ref<string>(''),
        isRail = ref<boolean>(disp.mdAndUp.value ? false : true),
        isValid = ref<boolean>(true),
        isLoading = ref<boolean>(false),
        searchParam = reactive<TextSearchParam>({
          q: '',
          el: [],
          tag: [],
          bid: [],
          page: 0,
          perPage: 20,
        }),
        elevelList = ref<string[]>(['OCR', 'PROOF_READ']),
        elevelColor = reactive<{ [elevel: string]: string }>({
          'OCR': 'dark-grey',
          'PROOF_READ': 'grey',
        }),
        recordCount = ref<RecordCount>({}),
        data = ref<Data | null>(null)
  
  // computed
  const facets = computed<Facet | null>(() => {
    if (!data.value) {
      return null
    }
    const f: Facet = {
      keywords: {
        count: 0,
        words: {},
      }
    }
    for (const [cls, words] of Object.entries(data.value?.filters.keyword)) {
      const key: string = Object.keys(words)[0]
      f.keywords.words[key] = {
        count: 0,
        elevels: {},
        class: cls,
        variants: {},
      }
      for (const [word, elevels] of Object.entries(words)) {
        f.keywords.words[key].variants[word] = true
        for (const [elevel, ids] of Object.entries(elevels)) {
          f.keywords.words[key].elevels[elevel] = {
            count: 0,
            ids: {},
          }
          for (const [id, num] of Object.entries(ids)) {
            f.keywords.count += num
            f.keywords.words[key].count += num
            f.keywords.words[key].elevels[elevel].count += num
            f.keywords.words[key].elevels[elevel].ids[id] = num
          }
        }
      }
    }
    return f
  })
  const bibls = computed<Bibl>(() => data.value?.bibl || {})
  const matches = computed<Match[]>(() => data.value?.match || [])
  const total = computed<number>(() => data.value?.total || 0)

  // methods
  function searchProps2Param() {
    searchParam.bid = props.bid?.split(',').sort() || []
    searchParam.q = props.q.split(',')
      .map((w: string): string => w.indexOf(' ') === -1 ? w :  `"${w}"`)
      .join(' ')
    if (searchParam.bid.length > 0) {
      searchParam.q += ' bid:' + searchParam.bid.join(',')
    }
    searchParam.el = props.el?.split(',') || elevelList.value
    searchParam.tag = props.tag?.split(',') || []
    searchParam.page = parseInt(props.page) || 1
    searchParam.perPage = parseInt(props.perPage) || 20
    loadItems()
  }

  function searchParam2Query<T>(opt?: {
    q?: string
    el?: string
    tag?: string
    bid?: string
    page?: number
    perPage?: number
  }): T {
    const regexp = /(:?"([^"]+)"|([^\s]+))/g;
    const t: {
      q: string
      el?: string
      tag?: string
      bid?: string
      page?: number
      perPage?: number
    } = { q: ''}

    const aq: string[] = []
    const abid: string[] = []
    const matches: RegExpMatchArray[] = [
      ...searchParam.q.matchAll(regexp),
    ]
    for (let i = 0; i < matches.length; i++) {
      const s:string = (matches[i][2] || matches[i][1]) as unknown as string
      if (s.slice(0, 4) === 'bid:') {
        abid.push(s.slice(4))
      } else {
        aq.push(s)
      }
    }

    t.q = aq.join(',')
    if (abid.length > 0) {
      t.bid = abid.join(',')
    }
    if (searchParam.el && searchParam.el.length < elevelList.value.length) {
      t.el = searchParam.el.join(',')
    }
    if (searchParam.tag && searchParam.tag.length > 0) {
      t.tag = searchParam.tag?.join(',')
    }
    if (searchParam.page !== 1) {
      t.page = searchParam.page
    }
    if (searchParam.perPage !== 20) {
      t.perPage = searchParam.perPage
    }
    if (opt) {
      Object.assign(t, opt)
      if (t.el === '') {
        delete t.el
      }
      if (t.tag === '') {
        delete t.tag
      }
      if (t.bid === '') {
        delete t.bid
      }
      if (t.page === 1) {
        delete t.page
      }
      if (t.perPage === 20) {
        delete t.perPage
      }
    }
    return t as T
  }

  function routerPush<T>(opt?: {
    q?: string
    el?: string
    tag?: string
    bid?: string
    page?: number
    perPage?: number
  }): void {
    router.push({
      name: 'Search',
      query: searchParam2Query<LocationQueryRaw>(opt),
    })
  }

  async function loadItems(): Promise<void> {
    isLoading.value = true
    const response = await repository.texts
      .getNgramSearch(searchParam2Query<TextSearchQueryString>())
      .catch((e) => {
        errmsg.value = e.response.data.message
      })
    if (response) {
      errmsg.value = ''
      data.value = response.data
    }
    isLoading.value = false
  }

  function getKokushoLink(item: Match): string {
    return `https://kokusho.nijl.ac.jp/biblio/${bibls.value[item.id].bid}/${item.pages[0]+1}`
  }

  function getRectURLs(item: Match): string[] {
    const hrefs: string[] = []
    let xl, xr, yt, yb, z: number
    let prev: string = ''
    xl = yt = Number.MAX_SAFE_INTEGER
    xr = yb = 0
    prev = item.imageIDs[0]

    for (let i = 0; i < item.imageIDs.length; i++) {
      if (prev !== item.imageIDs[i]) {
        hrefs.push(`${prev}/${xl},${yt},${xr-xl},${yb-yt}/,600/0/default.jpg`)
        xl = yt = Number.MAX_SAFE_INTEGER
        xr = yb = 0
        prev = item.imageIDs[i]
      }
      if (xl > item.bbs[i].x) {
        xl = item.bbs[i].x
      }
      if (yt > item.bbs[i].y) {
        yt = item.bbs[i].y
      }
      if (xr < (z = item.bbs[i].x + item.bbs[i].w)) {
        xr = z
      }
      if (yb < (z = item.bbs[i].y + item.bbs[i].h)) {
        yb = z
      }
    }
    hrefs.push(`${prev}/${xl},${yt},${xr-xl},${yb-yt}/,600/0/default.jpg`)
    return hrefs
  }
  
  const getColorName = function(): (name: string) => string {
    let idx = 0
    const colors: string[] = [
      'red', 'purple', 'pink', 'deep-purple', 'indigo',
    ]
    const hash: {[key: string]: string} = {}
    return function(name: string): string {
      if (!hash[name]) {
        hash[name] = colors[idx]
        idx++
        if (idx === colors.length) {
          idx = 0
        }
      }
      return hash[name]
    }
  }()

  function convertClassName(text: string): string {
    return text.replaceAll(/em class="(hlt\d+)"/g,
      (_, cls) => ('em class="' + getColorName(cls) + '"'))
  }
  
  function getBid(id: string): string {
    return bibls.value[id].bid
  }

  function getTitle(id: string): string {
    const m = bibls.value[id]
    return `${m.bid} ${m.label}`
  }

  function getELevel(id: string): string {
    return bibls.value[id].elevel
  }

  function getELevelColor(id: string): string {
    return elevelColor[bibls.value[id].elevel]
  }

  async function fetchCount(): Promise<void> {
    const response = await repository.texts.getCount()
    recordCount.value = response.data.recordCount
  }

  watch(
    () => props,
    searchProps2Param,
    { deep: true },
  )

  // Lifecycle hook
  onMounted(() => {
    fetchCount()
    searchProps2Param()
  })
</script>

<style scoped>
.router-link-active {
  text-decoration: none;
  color: inherit;
}

em, span.match ::v-deep(em) {
  font-style: normal;
  font-weight: bold;
}

em.red, span.match ::v-deep(em.red) {
  color: #F44336;
}

em.pink, span.match ::v-deep(em.pink) {
  color: #E91E63;
}

em.purple, span.match ::v-deep(em.purple) {
  color: #9C27B0;
}

em.deep-purple, span.match ::v-deep(em.deep-purple) {
  color: #673AB7;
}

em.indigo, span.match ::v-deep(em.indigo) {
  color: #3f51B5;
}
</style>
