/*
Converted from the Fusion 360 USDZ export. The file is in metres and carries a
baked "Spin" clip: the Wheel node turns once every 30 s and each Cabin node
counter-rotates about its pin so the cabins stay level.
*/

import React, { useEffect, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'

export function Model(props) {
  const group = useRef()
  const { scene, animations } = useGLTF('/FerrisWheel.glb')
  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    actions.Spin?.play()
  }, [actions])

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload('/FerrisWheel.glb')
