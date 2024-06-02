'use client'

/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.2.17 public/MountainBase.glb --transform 
Files: public/MountainBase.glb [4.3KB] > /Users/richard/Documents/richardbt.com/MountainBase-transformed.glb [1.45KB] (66%)
*/

import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export default function Model(props) {
  const { nodes, materials } = useGLTF('/MountainBase-transformed.glb')
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Body3.geometry} material={materials.F_bccfbb6b826b40928b212725fa1ee07b} scale={10} />
    </group>
  )
}

useGLTF.preload('/MountainBase-transformed.glb')
