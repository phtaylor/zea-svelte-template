<script>
  import { redirect } from '@roxi/routify'
  import { onMount } from 'svelte'

  import Header from '../components/Header.svelte'
  import Renderer from '../components/Renderer.svelte'
  import { auth } from '../helpers/auth'

  let userData
  let session

  onMount(async () => {
    const isAuthenticated = await auth.isAuthenticated()
    if (!isAuthenticated) {
      $redirect('/login')
    }
  })
</script>

<zea-layout orientation="vertical" cell-a-size="50" add-cells="AB" borders>
  <div slot="A" class="h-full w-full">
    <Header />
  </div>
  <div slot="B" class="h-full w-full">
    <Renderer />
  </div>
</zea-layout>
