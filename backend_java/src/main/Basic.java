public class Basic {
    public static void main(String[] args) {
        int[] arr = {3,9,1,6,7,12,73};

        minimum(arr);
    }

    public static void minimum(int[] arr){
        int i = 0;
        int min = 0;
        while(i<=arr.length-1){
            if(arr[i]<arr[min]){
                min = i;
            }
            i++;
        }
        System.out.println("Index minimum: "+min);
        System.out.println("The minimum value: "+arr[min]);
    }
}
