<style>
  .logo {
    width: 5em;
  }

  .divider {
    border-right: 2px solid var(--color-grey-1);
    height: calc(100% - 2px);
    flex-grow: 1;
  }
</style>

<div class="flex items-center w-full h-full px-2">
  <div class="logo flex items-center h-full mr-4">
    <img src="https://cdn.glitch.com/902123f3-ae96-4804-b014-ff54744cf91a%2Flogo-zea.svg?v=1600384733817" alt="logo">
  </div>
  <zea-user-chip-set id="zea-user-chip-set"></zea-user-chip-set>
  <div class="divider"></div>
  <zea-user-chip id="zea-user-chip"></zea-user-chip>
</div>