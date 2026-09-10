(()=>{
  const qs=new URLSearchParams(location.search)
  const emojis=['🎯','🚲','🚗','🎓','⚽','🧸','🎮','🎵','✈️','🏕️','🐴','🐶','📚','💻','🎨','🎁','⭐','💛','🏠','🌈']

  function patchApprovedUi(){
    try{
      if(typeof state!=='undefined'&&state.bankDetails==null)state.bankDetails=''

      const birth=document.getElementById('setting-birthdate')
      if(birth&&!document.getElementById('setting-bank-details')){
        const anchor=birth.closest('.date-input-wrap')||birth
        const label=document.createElement('label');label.className='field-label';label.htmlFor='setting-bank-details';label.textContent='Bankgegevens'
        const field=document.createElement('textarea');field.className='text-input textarea';field.id='setting-bank-details';field.rows=3;field.placeholder='Bijv. NL00 BANK 0123 4567 89 t.n.v. ...'
        const help=document.createElement('p');help.className='tiny-left';help.textContent='Deze gegevens zijn alleen bedoeld voor de beheeromgeving.'
        anchor.after(label,field,help)
        field.value=(typeof settingsDraft!=='undefined'&&settingsDraft?.bankDetails)||state?.bankDetails||''
        field.addEventListener('input',()=>{
          if(typeof settingsDraft!=='undefined'&&settingsDraft)settingsDraft.bankDetails=field.value
          if(typeof state!=='undefined')state.bankDetails=field.value
        })
      }
      document.querySelector('.general-description-field')?.remove()

      const emojiInput=document.getElementById('new-goal-emoji')
      if(emojiInput&&emojiInput.type!=='hidden'){
        const parent=emojiInput.parentElement
        parent?.classList.add('emoji-goal-field')
        const value=emojiInput.value||'✨'
        emojiInput.type='hidden';emojiInput.value=value
        const trigger=document.createElement('button');trigger.type='button';trigger.id='new-goal-emoji-btn';trigger.className='emoji-picker-trigger';trigger.textContent=value;trigger.setAttribute('aria-label','Kies emoji')
        const pop=document.createElement('div');pop.id='new-goal-emoji-picker';pop.className='emoji-picker-popover';pop.hidden=true
        emojis.forEach(emoji=>{const b=document.createElement('button');b.type='button';b.textContent=emoji;b.addEventListener('click',()=>{emojiInput.value=emoji;trigger.textContent=emoji;pop.hidden=true});pop.appendChild(b)})
        trigger.addEventListener('click',()=>{pop.hidden=!pop.hidden})
        emojiInput.before(trigger);parent?.appendChild(pop)
        document.getElementById('add-goal-btn')?.addEventListener('click',()=>setTimeout(()=>{trigger.textContent=emojiInput.value||'✨'},0))
      }

      const target=document.getElementById('new-goal-target')
      const targetLabel=target?.closest('.settings-goal-field')?.querySelector('label')
      if(targetLabel)targetLabel.textContent='Spaardoel'

      const product=document.getElementById('fetch-product-btn'),url=document.getElementById('setting-wish-url')
      if(product&&url){product.textContent='Productgegevens ophalen';url.insertAdjacentElement('afterend',product)}
    }catch{}
  }

  patchApprovedUi()
  setTimeout(patchApprovedUi,0)
  if(qs.get('view')==='settings'){
    setTimeout(()=>{
      document.getElementById('open-settings')?.click()
      setTimeout(patchApprovedUi,0)
    },20)
  }
})()
