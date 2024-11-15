import main.Init;

public class Main {
    public static void main(String[] args) {
        System.out.println("1");
        Init.instance().startAndWait(true);
        System.out.println("2");
    }
}
