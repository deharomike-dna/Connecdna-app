import React, { useCallback, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { signals, credentialing, auth } from '../api/dna-client'
import { COLORS, S, SPACING } from '../theme'

export function SignalsScreen() {
  const [data, setData] = useState<any[]>([])
  const load = useCallback(async () => {
    try { const res = await signals.getAll(); setData(res.signals ?? []) } catch {}
  }, [])
  useFocusEffect(useCallback(() => { load() }, [load]))
  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}><Text style={S.pageTitle}>Signals</Text></View>
      <FlatList data={data} keyExtractor={(_,i)=>String(i)}
        contentContainerStyle={{padding:SPACING.lg}}
        renderItem={({item}:any)=>(
          <View style={[S.card,{borderLeftWidth:3,borderLeftColor:item.category==='block'?COLORS.red:item.category==='friction'?COLORS.amber:COLORS.blue}]}>
            <Text style={{fontSize:13,fontWeight:'600',color:COLORS.text,marginBottom:4}}>{item.title}</Text>
            <Text style={{fontSize:12,color:COLORS.text2}}>{item.message}</Text>
          </View>
        )}
        ListEmptyComponent={<View style={{alignItems:'center',paddingTop:60}}><Text style={{color:COLORS.text3}}>No active signals</Text></View>}
      />
    </SafeAreaView>
  )
}

export function CredentialingScreen() {
  const [status, setStatus] = useState<any>(null)
  const load = useCallback(async () => {
    try { const s = await auth.getSession(); if(s.userId) { const r = await credentialing.getStatus(s.userId,'md'); setStatus(r) } } catch {}
  }, [])
  useFocusEffect(useCallback(()=>{load()},[load]))
  const pct = status?.completionPercent ?? 0
  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}><Text style={S.pageTitle}>Credentials</Text></View>
      <ScrollView contentContainerStyle={{padding:SPACING.lg}}>
        <View style={[S.card,{alignItems:'center',paddingVertical:SPACING.xl}]}>
          <Text style={{fontFamily:'Courier',fontSize:48,fontWeight:'500',color:pct===100?COLORS.green:pct>=70?COLORS.amber:COLORS.red}}>{pct}%</Text>
          <Text style={{fontSize:13,color:COLORS.text2,marginTop:4}}>Credentialing complete</Text>
        </View>
        {status?.blockingIssues?.map((issue:string,i:number)=>(
          <View key={i} style={[S.card,S.cardRed]}><Text style={{fontSize:12,color:COLORS.red}}>⚠ {issue}</Text></View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

export function AdminScreen() {
  const items = [
    {icon:'👥',label:'Users & Roles',sub:'Manage staff and providers'},
    {icon:'📍',label:'Locations',sub:'Clinics and facilities'},
    {icon:'🏥',label:'EHR Connections',sub:'Epic, Athena, eCW'},
    {icon:'💳',label:'Billing',sub:'Subscription and usage'},
    {icon:'📊',label:'Reports',sub:'Revenue and risk analytics'},
  ]
  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}><Text style={S.pageTitle}>Admin</Text></View>
      <ScrollView contentContainerStyle={{padding:SPACING.lg}}>
        {items.map((item,i)=>(
          <TouchableOpacity key={i} style={[S.card,{flexDirection:'row',alignItems:'center',gap:SPACING.md}]}>
            <Text style={{fontSize:24}}>{item.icon}</Text>
            <View style={{flex:1}}>
              <Text style={{fontSize:14,fontWeight:'500',color:COLORS.text}}>{item.label}</Text>
              <Text style={{fontSize:12,color:COLORS.text3}}>{item.sub}</Text>
            </View>
            <Text style={{fontSize:16,color:COLORS.text3}}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

export function PatientCheckinScreen() {
  const [entered, setEntered] = useState('')
  const [checkedIn, setCheckedIn] = useState(false)
  if (checkedIn) return (
    <SafeAreaView style={[S.screen,{alignItems:'center',justifyContent:'center',padding:SPACING.xl}]}>
      <Text style={{fontSize:48,marginBottom:16}}>✓</Text>
      <Text style={{fontSize:22,fontWeight:'600',color:COLORS.text,marginBottom:8}}>Checked in</Text>
      <TouchableOpacity style={[S.btnSecondary,{marginTop:SPACING.xl,width:'100%'}]} onPress={()=>{setCheckedIn(false);setEntered('')}}>
        <Text style={S.btnSecondaryText}>New check-in</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}><Text style={S.pageTitle}>Check-in</Text></View>
      <View style={{padding:SPACING.lg}}>
        <View style={{flexDirection:'row',justifyContent:'center',gap:8,marginBottom:SPACING.lg}}>
          {Array.from({length:6}).map((_,i)=>(
            <View key={i} style={{width:44,height:54,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:COLORS.surface2,borderWidth:1,borderColor:entered[i]?COLORS.green:COLORS.border2}}>
              <Text style={{fontFamily:'Courier',fontSize:22,color:entered[i]?COLORS.green:COLORS.text3}}>{entered[i]??''}</Text>
            </View>
          ))}
        </View>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:SPACING.lg}}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k,i)=>(
            <TouchableOpacity key={i} onPress={()=>{
              if(!k)return
              if(k==='⌫'){setEntered(e=>e.slice(0,-1));return}
              if(entered.length>=6)return
              setEntered(e=>e+k)
            }} style={{width:'30%',height:56,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:k?COLORS.surface:'transparent',borderWidth:k?1:0,borderColor:COLORS.border}}>
              <Text style={{fontSize:k==='⌫'?18:22,fontWeight:'500',color:COLORS.text}}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[S.btnPrimary,{opacity:entered.length<6?0.4:1}]} onPress={()=>{if(entered.length>=6)setCheckedIn(true)}} disabled={entered.length<6}>
          <Text style={S.btnPrimaryText}>Confirm check-in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export function PatientInsuranceScreen() {
  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}><Text style={S.pageTitle}>Insurance</Text></View>
      <ScrollView contentContainerStyle={{padding:SPACING.lg}}>
        <View style={{backgroundColor:'#1a2a4a',borderRadius:16,padding:SPACING.lg,marginBottom:SPACING.md,borderWidth:1,borderColor:COLORS.blueBorder}}>
          <Text style={{fontSize:11,fontWeight:'600',color:COLORS.blue,letterSpacing:1,marginBottom:SPACING.md}}>BLUECROSS BLUESHIELD</Text>
          <Text style={{fontSize:18,fontWeight:'600',color:COLORS.text,marginBottom:2}}>James Davidson</Text>
          <Text style={{fontSize:12,color:COLORS.text2}}>Member ID: BCB-928471</Text>
        </View>
        <View style={S.card}>
          {[['Primary care','$25 copay'],['Specialist','$50 copay'],['Emergency','$250 copay'],['Deductible','$420 of $1,500']].map(([k,v],i)=>(
            <View key={i} style={[S.spaceBetween,{paddingVertical:8,borderBottomWidth:1,borderBottomColor:COLORS.border}]}>
              <Text style={{fontSize:12,color:COLORS.text2}}>{k}</Text>
              <Text style={{fontSize:12,fontWeight:'500',color:COLORS.text}}>{v}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export function PatientVisitsScreen() {
  const visits = [
    {month:'APR',day:'28',title:'Follow-up · Dr. Chen',sub:'Miami Clinic · 10:30 AM',today:true},
    {month:'MAR',day:'15',title:'Annual physical · Dr. Chen',sub:'Miami Clinic · Completed',today:false},
    {month:'FEB',day:'3',title:'Cardiology consult',sub:'Miami Clinic · Completed',today:false},
  ]
  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}><Text style={S.pageTitle}>Visits</Text></View>
      <FlatList data={visits} keyExtractor={(_,i)=>String(i)} contentContainerStyle={{padding:SPACING.lg}}
        renderItem={({item})=>(
          <View style={[S.card,item.today?S.cardGreen:{}]}>
            <View style={S.row}>
              <View style={{width:44,alignItems:'center',backgroundColor:COLORS.surface2,borderRadius:8,padding:6,marginRight:SPACING.md}}>
                <Text style={{fontSize:9,color:COLORS.text3,textTransform:'uppercase'}}>{item.month}</Text>
                <Text style={{fontFamily:'Courier',fontSize:18,fontWeight:'500',color:COLORS.text}}>{item.day}</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={{fontSize:13,fontWeight:'500',color:COLORS.text}}>{item.title}</Text>
                <Text style={{fontSize:11,color:COLORS.text3,marginTop:2}}>{item.sub}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

export function PatientProfileScreen() {
  return (
    <SafeAreaView style={S.screen}>
      <View style={S.header}><Text style={S.pageTitle}>Profile</Text></View>
      <ScrollView contentContainerStyle={{padding:SPACING.lg}}>
        <View style={{alignItems:'center',marginBottom:SPACING.xl}}>
          <View style={{width:72,height:72,borderRadius:36,backgroundColor:COLORS.blue,alignItems:'center',justifyContent:'center',marginBottom:SPACING.md}}>
            <Text style={{fontSize:24,fontWeight:'600',color:'white'}}>JD</Text>
          </View>
          <Text style={{fontSize:20,fontWeight:'600',color:COLORS.text}}>James Davidson</Text>
        </View>
        <TouchableOpacity style={S.btnDanger}><Text style={S.btnDangerText}>Sign out</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
