import React, { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { supabase } from './lib/supabase.js'

export default function ManageV2(){
  const { id } = useParams()
  const [state,setState] = useState({loading:true,loggedIn:true,error:''})

  useEffect(()=>{
    let cancelled=false
    ;(async()=>{
      const { data:{ session } } = await supabase.auth.getSession()
      if(cancelled)return
      if(!session){setState({loading:false,loggedIn:false,error:''});return}
      const { data,error } = await supabase.from('dreampots').select('slug').eq('id',id).single()
      if(cancelled)return
      if(error || !data?.slug){setState({loading:false,loggedIn:true,error:'Droompot niet gevonden'});return}
      window.location.replace(`/p/${encodeURIComponent(data.slug)}?view=settings`)
    })()
    return()=>{cancelled=true}
  },[id])

  if(!state.loggedIn)return <Navigate to="/login" replace />
  return <main className="app-shell"><section className="screen active"><div className="placeholder-wrap"><h2>{state.error||'Beheer openen…'}</h2>{state.error&&<p>Ga terug naar je Droompot-overzicht en probeer opnieuw.</p>}</div></section></main>
}
