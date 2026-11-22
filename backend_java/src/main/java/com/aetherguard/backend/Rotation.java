package com.aetherguard.backend;

import java.util.Arrays;
class Rotation{
  public static void main(String[] args){
    int[] arr = {2,4,8,5,9,1,68,3};

    int start = 0;
    int end = arr.length-1;

    while(start<end){
      int temp = arr[start];
      arr[start] = arr[end];
      arr[end] = temp;

      start++;
      end--;
    }

    System.out.println(Arrays.toString(arr));
  }
}
